import * as XLSX from 'xlsx';
import { CategorizationService } from './categorization.service';
import { ExpenseRepository } from '../repositories/expense.repository';
import { ExpenseCategory } from '@prisma/client';
import { parse, format } from 'date-fns';

export interface ParsedTransaction {
  date: Date;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: ExpenseCategory;
  confidence: number;
}

export class StatementService {
  private categorizationService = new CategorizationService();
  private expenseRepository = new ExpenseRepository();

  async parseStatement(fileBuffer: Buffer, fileExtension: string): Promise<ParsedTransaction[]> {
    let rawRows: any[] = [];

    if (fileExtension.toLowerCase() === '.csv') {
      const csvText = fileBuffer.toString('utf8');
      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    } else {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    }

    if (rawRows.length < 2) {
      return [];
    }

    // Find the header row
    let headerIdx = -1;
    for (let i = 0; i < Math.min(10, rawRows.length); i++) {
      const row = rawRows[i];
      if (Array.isArray(row) && row.some(cell => {
        const str = String(cell).toLowerCase();
        return str.includes('date') || str.includes('description') || str.includes('debit') || str.includes('amount');
      })) {
        headerIdx = i;
        break;
      }
    }

    if (headerIdx === -1) {
      headerIdx = 0; // fallback to first row
    }

    const headers = (rawRows[headerIdx] as any[]).map(h => String(h).toLowerCase().trim());
    
    // Map headers to key positions
    const colIndices = {
      date: headers.findIndex(h => h.includes('date')),
      description: headers.findIndex(h => h.includes('desc') || h.includes('narr') || h.includes('merchant') || h.includes('detail')),
      debit: headers.findIndex(h => h.includes('deb') || h.includes('withd') || h.includes('spent') || h.includes('pay')),
      credit: headers.findIndex(h => h.includes('cred') || h.includes('dep') || h.includes('rec')),
      amount: headers.findIndex(h => h.includes('amt') || h.includes('amount')), // Fallback single column
      balance: headers.findIndex(h => h.includes('bal')),
    };

    const parsedTransactions: ParsedTransaction[] = [];

    for (let i = headerIdx + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!Array.isArray(row) || row.length === 0 || row.every(c => c === null || c === undefined || c === '')) {
        continue;
      }

      // Parse Date
      let txDate = new Date();
      if (colIndices.date !== -1) {
        const rawDate = row[colIndices.date];
        if (rawDate) {
          txDate = this.parseDateString(String(rawDate));
        }
      }

      // Parse Description
      let description = 'Unknown Transaction';
      if (colIndices.description !== -1) {
        description = String(row[colIndices.description] || '').trim();
      }

      // Parse Debit / Credit
      let debit = 0;
      let credit = 0;

      if (colIndices.debit !== -1) {
        debit = this.parseNumber(row[colIndices.debit]);
      }
      if (colIndices.credit !== -1) {
        credit = this.parseNumber(row[colIndices.credit]);
      }

      // Handle single amount column case
      if (debit === 0 && credit === 0 && colIndices.amount !== -1) {
        const amt = this.parseNumber(row[colIndices.amount]);
        if (amt < 0) {
          debit = Math.abs(amt);
        } else {
          credit = amt;
        }
      }

      // Parse Balance
      let balance = 0;
      if (colIndices.balance !== -1) {
        balance = this.parseNumber(row[colIndices.balance]);
      }

      // Only import valid transactions with activity
      if (debit === 0 && credit === 0) {
        continue;
      }
      // Auto categorization for debit (expenses)
      let category: ExpenseCategory = ExpenseCategory.Other;
      let confidence = 0.0;

      if (debit > 0) {
        const catRes = this.categorizationService.categorize(description);
        category = catRes.category;
        confidence = catRes.confidence;
      } else if (credit > 0) {
        category = ExpenseCategory.Other; // Deposits can just be other / ignored for expense tracking
        confidence = 1.0;
      }

      parsedTransactions.push({
        date: txDate,
        description,
        debit,
        credit,
        balance,
        category,
        confidence,
      });
    }

    return parsedTransactions;
  }

  async confirmImport(userId: string, transactions: ParsedTransaction[]): Promise<number> {
    let importCount = 0;

    for (const tx of transactions) {
      if (tx.debit > 0) {
        // Store as expense
        await this.expenseRepository.create({
          userId,
          amount: tx.debit,
          category: tx.category,
          description: tx.description,
          date: tx.date,
          paymentMethod: 'Bank Statement',
          merchantName: this.extractMerchantName(tx.description),
          transactionSource: 'statement_upload',
          recurring: false,
        });
        importCount++;
      }
    }

    return importCount;
  }

  private extractMerchantName(desc: string): string {
    // Simple merchant extraction: strip out reference IDs / standard transaction prefixes
    let clean = desc.replace(/(pos|upi|neft|rtgs|chg|transfer|payment|withdraw|dep|txn|ref|val|date)/gi, '');
    clean = clean.replace(/[\d\-/.*]+/g, ' '); // remove numbers and symbols
    clean = clean.trim();
    if (clean.length === 0) return desc;
    // return first 3 words
    return clean.split(/\s+/).slice(0, 3).join(' ');
  }

  private parseNumber(val: any): number {
    if (val === null || val === undefined || val === '') return 0;
    if (typeof val === 'number') return val;
    const clean = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  private parseDateString(dateStr: string): Date {
    // Check if the input is a pure numeric string representing an Excel serial date
    const num = Number(dateStr);
    if (!isNaN(num) && num > 30000 && num < 60000) {
      // Excel serial date to JS Date: 25569 is days between Jan 1, 1900 and Jan 1, 1970
      return new Date((num - 25569) * 86400 * 1000);
    }

    // Try standard JS date parsing
    let parsed = new Date(dateStr);
    // Standard JS Date constructor parses 5-digit numbers as years (e.g. "46144" as year 46144)
    // We restrict valid years to < 3000 to catch this error and fallback to our custom format parsers
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() < 3000) return parsed;

    // Try common statement formats like DD-MM-YYYY, DD/MM/YYYY, YYYY/MM/DD
    const formats = ['dd-MM-yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd', 'yyyy/MM/dd', 'dd MMM yyyy', 'dd-MMM-yyyy'];
    for (const fmt of formats) {
      try {
        parsed = parse(dateStr, fmt, new Date());
        if (!isNaN(parsed.getTime())) return parsed;
      } catch (e) {
        // ignore format failure, try next
      }
    }

    return new Date(); // fallback
  }
}
