import { Response, NextFunction } from 'express';
import { ExpenseService } from '../services/expense.service';
import { StatementService } from '../services/statement.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import path from 'path';

export class ExpenseController {
  private expenseService = new ExpenseService();
  private statementService = new StatementService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const expense = await this.expenseService.createExpense(userId, req.body);
      res.status(201).json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  };

  get = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const expense = await this.expenseService.getExpense(id, userId);
      res.status(200).json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updated = await this.expenseService.updateExpense(id, userId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await this.expenseService.deleteExpense(id, userId);
      res.status(200).json({ success: true, message: 'Expense deleted successfully.' });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const result = await this.expenseService.listExpenses(userId, req.query);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  uploadStatement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded.' });
      }

      const fileBuffer = req.file.buffer;
      const fileExt = path.extname(req.file.originalname);
      
      const parsedTransactions = await this.statementService.parseStatement(fileBuffer, fileExt);

      res.status(200).json({
        success: true,
        data: parsedTransactions,
      });
    } catch (err) {
      next(err);
    }
  };

  confirmImport = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const transactions = req.body.transactions; // Expects the list of validated preview rows
      
      if (!Array.isArray(transactions)) {
        return res.status(400).json({ success: false, message: 'Invalid transactions format.' });
      }

      const importedCount = await this.statementService.confirmImport(userId, transactions);

      res.status(200).json({
        success: true,
        message: `Successfully imported ${importedCount} expenses.`,
      });
    } catch (err) {
      next(err);
    }
  };
}
