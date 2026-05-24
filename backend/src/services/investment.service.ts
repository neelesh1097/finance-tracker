import { InvestmentRepository } from '../repositories/investment.repository';
import { Prisma, Investment } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { calculateCAGR, calculateXIRR } from '../utils/calculations';
import { differenceInDays } from 'date-fns';

export class InvestmentService {
  private investmentRepository = new InvestmentRepository();

  async createInvestment(userId: string, data: any): Promise<Investment> {
    return this.investmentRepository.create({
      userId,
      amount: new Prisma.Decimal(data.amount),
      investmentType: data.investmentType,
      interestRate: new Prisma.Decimal(data.interestRate),
      startDate: new Date(data.startDate),
      maturityDate: data.maturityDate ? new Date(data.maturityDate) : null,
      currentValue: new Prisma.Decimal(data.currentValue),
      expectedValue: new Prisma.Decimal(data.expectedValue),
    });
  }

  async getInvestment(id: string, userId: string): Promise<Investment> {
    const investment = await this.investmentRepository.findById(id);
    if (!investment || investment.userId !== userId) {
      throw new AppError('Investment not found', 404);
    }
    return investment;
  }

  async updateInvestment(id: string, userId: string, data: any): Promise<Investment> {
    await this.getInvestment(id, userId);

    return this.investmentRepository.update(id, {
      amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
      investmentType: data.investmentType || undefined,
      interestRate: data.interestRate ? new Prisma.Decimal(data.interestRate) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      maturityDate: data.maturityDate !== undefined ? (data.maturityDate ? new Date(data.maturityDate) : null) : undefined,
      currentValue: data.currentValue ? new Prisma.Decimal(data.currentValue) : undefined,
      expectedValue: data.expectedValue ? new Prisma.Decimal(data.expectedValue) : undefined,
    });
  }

  async deleteInvestment(id: string, userId: string): Promise<Investment> {
    await this.getInvestment(id, userId);
    return this.investmentRepository.delete(id);
  }

  async getPortfolioSummary(userId: string) {
    const investments = await this.investmentRepository.findAllByUser(userId);
    
    if (investments.length === 0) {
      return {
        investments: [],
        summary: {
          totalInvested: 0,
          totalCurrentValue: 0,
          totalReturns: 0,
          overallROI: 0,
          overallCAGR: 0,
          overallXIRR: 0,
        },
      };
    }

    let totalInvested = 0;
    let totalCurrentValue = 0;

    // Build cash flows for portfolio XIRR
    // 1. Initial cash outflow (buying investments) - negative
    // 2. Current portfolio value (as if we sold today) - positive
    const cashFlows: { amount: number; date: Date }[] = [];
    const today = new Date();

    for (const inv of investments) {
      const amt = Number(inv.amount);
      const curVal = Number(inv.currentValue);
      
      totalInvested += amt;
      totalCurrentValue += curVal;

      // Outflow (negative)
      cashFlows.push({
        amount: -amt,
        date: new Date(inv.startDate),
      });

      // Inflow (positive) - current value mapped to today
      cashFlows.push({
        amount: curVal,
        date: today,
      });
    }

    const totalReturns = totalCurrentValue - totalInvested;
    const overallROI = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

    // Calculate CAGR over the entire portfolio age (from earliest start date to today)
    const startDates = investments.map(i => new Date(i.startDate).getTime());
    const minStartDate = new Date(Math.min(...startDates));
    const portfolioAgeYears = Math.max(differenceInDays(today, minStartDate) / 365, 0.01);
    
    // Fallback CAGR and XIRR to absolute ROI if the holding period is under 1 year
    const overallCAGR = portfolioAgeYears >= 1.0
      ? calculateCAGR(totalInvested, totalCurrentValue, portfolioAgeYears) * 100
      : overallROI;
    const overallXIRR = portfolioAgeYears >= 1.0
      ? calculateXIRR(cashFlows) * 100
      : overallROI;

    // Map each individual investment with calculated stats
    const items = investments.map(inv => {
      const amt = Number(inv.amount);
      const curVal = Number(inv.currentValue);
      const returns = curVal - amt;
      const roi = amt > 0 ? (returns / amt) * 100 : 0;
      
      const ageYears = Math.max(differenceInDays(today, new Date(inv.startDate)) / 365, 0.01);
      
      // Individual CAGR and XIRR fallback to absolute ROI if held for under a year
      const cagr = ageYears >= 1.0
        ? calculateCAGR(amt, curVal, ageYears) * 100
        : roi;

      // Individual XIRR: -amt at start, +curVal today
      const individualXIRR = ageYears >= 1.0
        ? calculateXIRR([
            { amount: -amt, date: new Date(inv.startDate) },
            { amount: curVal, date: today },
          ]) * 100
        : roi;

      return {
        ...inv,
        amount: amt,
        interestRate: Number(inv.interestRate),
        currentValue: curVal,
        expectedValue: Number(inv.expectedValue),
        returns,
        roi,
        cagr,
        xirr: individualXIRR,
      };
    });

    return {
      investments: items,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalReturns,
        overallROI,
        overallCAGR,
        overallXIRR,
      },
    };
  }
}
