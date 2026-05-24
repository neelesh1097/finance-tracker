import { ExpenseRepository } from '../repositories/expense.repository';
import { BudgetRepository } from '../repositories/budget.repository';
import { startOfMonth, subMonths, format, endOfMonth } from 'date-fns';
import { prisma } from '../config/db';
import { ExpenseCategory } from '@prisma/client';

export class ForecastService {
  private expenseRepository = new ExpenseRepository();
  private budgetRepository = new BudgetRepository();

  async getForecastData(userId: string) {
    const today = new Date();
    
    // Fetch historical data for past 6 months
    const monthlySpending: { monthName: string; total: number; date: Date }[] = [];
    const monthlyCategories: Record<string, Record<ExpenseCategory, number>> = {};

    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(today, i));
      const monthEnd = endOfMonth(subMonths(today, i));
      
      const totalSpent = await this.expenseRepository.sumExpenses(userId, monthStart, monthEnd);
      const catTotals = await this.expenseRepository.getCategoryTotals(userId, monthStart, monthEnd);
      
      const monthLabel = format(monthStart, 'MMM yyyy');
      monthlySpending.push({
        monthName: monthLabel,
        total: totalSpent,
        date: monthStart,
      });

      monthlyCategories[monthLabel] = {} as Record<ExpenseCategory, number>;
      catTotals.forEach(c => {
        monthlyCategories[monthLabel][c.category] = c.amount;
      });
    }

    // 1. Linear Regression on Total Spending
    // x = month index (1 to 6), y = total spending
    const N = monthlySpending.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < N; i++) {
      const x = i + 1;
      const y = monthlySpending[i].total;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    }

    const denominator = (N * sumXX - sumX * sumX);
    let slope = 0;
    let intercept = sumY / N; // default to average if denominator is 0

    if (denominator !== 0) {
      slope = (N * sumXY - sumX * sumY) / denominator;
      intercept = (sumY - slope * sumX) / N;
    }

    // Predict next month's spending (x = 7)
    const predictedSpending = Math.max(0, slope * (N + 1) + intercept);

    // 2. Moving Average on Category Spending (using last 3 months)
    const last3Months = monthlySpending.slice(-3);
    const categoryForecasts: Record<string, number> = {};

    // Get all unique categories across last 3 months
    const allCategories = new Set<ExpenseCategory>();
    last3Months.forEach(m => {
      const catData = monthlyCategories[m.monthName] || {};
      Object.keys(catData).forEach(cat => allCategories.add(cat as ExpenseCategory));
    });

    allCategories.forEach(cat => {
      let sum = 0;
      last3Months.forEach(m => {
        sum += (monthlyCategories[m.monthName]?.[cat] || 0);
      });
      categoryForecasts[cat] = Math.round((sum / 3) * 100) / 100;
    });

    // 3. Predicted Balance and Overspending Checks
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const assumedMonthlyIncome = user ? Number(user.monthlyIncome) : 50000;
    const predictedBalance = Math.max(0, assumedMonthlyIncome - predictedSpending);
    
    // Check if projected spending exceeds the sum of active budget allocations
    const activeBudgets = await this.budgetRepository.findActiveBudgets(userId, today);
    const totalBudgetAllocation = activeBudgets.reduce((s, b) => s + Number(b.budgetAmount), 0);

    const predictedOverspend = totalBudgetAllocation > 0 && predictedSpending > totalBudgetAllocation
      ? predictedSpending - totalBudgetAllocation
      : 0;

    // Generate alerts
    const alerts = [];
    if (predictedSpending > assumedMonthlyIncome) {
      alerts.push({
        type: 'DANGER',
        message: `High risk: Your projected spending (₹${predictedSpending.toFixed(2)}) exceeds your monthly income (₹${assumedMonthlyIncome}).`,
      });
    } else if (predictedSpending > totalBudgetAllocation && totalBudgetAllocation > 0) {
      alerts.push({
        type: 'WARNING',
        message: `Budget warning: Your projected spending (₹${predictedSpending.toFixed(2)}) is set to exceed your total budget limit (₹${totalBudgetAllocation}) by ₹${predictedOverspend.toFixed(2)}.`,
      });
    }

    // Check specific categories crossing budget limits in forecast
    for (const [cat, forecastAmt] of Object.entries(categoryForecasts)) {
      const catBudgets = activeBudgets.filter(b => b.budgetCategory === cat);
      if (catBudgets.length > 0) {
        const catLimit = catBudgets.reduce((s, b) => s + Number(b.budgetAmount), 0);
        if (forecastAmt > catLimit) {
          alerts.push({
            type: 'WARNING',
            message: `Category risk: Forecasted spending for ${cat} (₹${forecastAmt.toFixed(2)}) exceeds its active budget allocation (₹${catLimit}).`,
          });
        }
      }
    }

    return {
      historicalSpending: monthlySpending.map(m => ({ month: m.monthName, spent: m.total })),
      predictedSpending: Math.round(predictedSpending * 100) / 100,
      predictedBalance: Math.round(predictedBalance * 100) / 100,
      predictedOverspend: Math.round(predictedOverspend * 100) / 100,
      categoryForecasts,
      alerts,
    };
  }
}
