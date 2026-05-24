import { ExpenseRepository } from '../repositories/expense.repository';
import { InvestmentRepository } from '../repositories/investment.repository';
import { BudgetRepository } from '../repositories/budget.repository';
import { SubscriptionRepository } from '../repositories/subscription.repository';
import { startOfMonth, endOfMonth, subMonths, format, differenceInDays } from 'date-fns';
import { prisma } from '../config/db';

export class AnalyticsService {
  private expenseRepository = new ExpenseRepository();
  private investmentRepository = new InvestmentRepository();
  private budgetRepository = new BudgetRepository();
  private subscriptionRepository = new SubscriptionRepository();

  async getDashboardAnalytics(userId: string) {
    const today = new Date();
    const startOfCurrentMonth = startOfMonth(today);
    const endOfCurrentMonth = endOfMonth(today);

    const startOfPrevMonth = startOfMonth(subMonths(today, 1));
    const endOfPrevMonth = endOfMonth(subMonths(today, 1));

    // 1. Current Month & Previous Month Expenses
    const currentMonthExpenses = await this.expenseRepository.sumExpenses(userId, startOfCurrentMonth, endOfCurrentMonth);
    const prevMonthExpenses = await this.expenseRepository.sumExpenses(userId, startOfPrevMonth, endOfPrevMonth);

    // 2. Average Daily Spending (current month)
    const daysInCurrentMonthPassed = Math.max(differenceInDays(today, startOfCurrentMonth) + 1, 1);
    const avgDailySpend = currentMonthExpenses / daysInCurrentMonthPassed;

    // 3. MoM Expense Growth
    let expenseGrowth = 0;
    if (prevMonthExpenses > 0) {
      expenseGrowth = ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
    }

    // 4. Highest Spend Category
    const categoryTotals = await this.expenseRepository.getCategoryTotals(userId, startOfCurrentMonth, endOfCurrentMonth);
    const highestSpend = categoryTotals.length > 0
      ? categoryTotals.reduce((max, c) => c.amount > max.amount ? c : max, categoryTotals[0])
      : { category: 'None', amount: 0 };

    // 5. Savings and Investment Metrics
    // Fetch monthly income from the user database record
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const monthlyIncome = user ? Number(user.monthlyIncome) : 50000;
    const savingsAmount = Math.max(0, monthlyIncome - currentMonthExpenses);
    const savingsRate = monthlyIncome > 0 ? (savingsAmount / monthlyIncome) * 100 : 0;

    // Income to Spend Ratio and Spend to Income Ratio
    const incomeToSpendRatio = currentMonthExpenses > 0 ? Number((monthlyIncome / currentMonthExpenses).toFixed(2)) : 0;
    const spendToIncomeRatio = monthlyIncome > 0 ? Number(((currentMonthExpenses / monthlyIncome) * 100).toFixed(2)) : 0;

    const portfolio = await this.investmentRepository.sumInvestments(userId);
    const totalInvested = portfolio.totalInvested;
    const totalCurrentValue = portfolio.totalCurrent;
    const totalInvestmentReturns = totalCurrentValue - totalInvested;

    // 6. Investment vs Expense Ratio
    const totalSpentAndInvested = currentMonthExpenses + totalInvested;
    const investmentRatio = totalSpentAndInvested > 0 ? (totalInvested / totalSpentAndInvested) * 100 : 0;
    const expenseRatio = totalSpentAndInvested > 0 ? (currentMonthExpenses / totalSpentAndInvested) * 100 : 0;

    // 7. Calculate Financial Health Score (out of 100)
    // - Savings Ratio (Max 30 points) - 30% savings rate = 30 points, scaled linearly
    const savingsPoints = Math.min(30, (savingsRate / 30) * 30);

    // - Investment Ratio (Max 30 points) - 20% of income invested = 30 points, scaled linearly
    const monthlyInvestments = await prisma.investment.aggregate({
      where: {
        userId,
        startDate: {
          gte: startOfCurrentMonth,
          lte: endOfCurrentMonth
        }
      },
      _sum: { amount: true }
    });
    const monthInvestedAmt = Number(monthlyInvestments._sum.amount || 0);
    const monthInvestRate = (monthInvestedAmt / monthlyIncome) * 100;
    const investmentPoints = Math.min(30, (monthInvestRate / 20) * 30);

    // - Budget Discipline (Max 20 points) - Spent vs Budget limit.
    // If spent <= budget, 20 points. If spent exceeds budget, subtract points.
    const activeBudgets = await this.budgetRepository.findActiveBudgets(userId, today);
    const totalBudgetAlloc = activeBudgets.reduce((s, b) => s + Number(b.budgetAmount), 0);
    let budgetPoints = 20;
    if (totalBudgetAlloc > 0 && currentMonthExpenses > totalBudgetAlloc) {
      const overspendPercent = ((currentMonthExpenses - totalBudgetAlloc) / totalBudgetAlloc) * 100;
      budgetPoints = Math.max(0, 20 - (overspendPercent / 10)); // subtract 1 point for every 10% overspend
    }

    // - Recurring Debt/Subscription Load (Max 20 points) - Active subscriptions / income.
    // Under 5% of income = 20 points. 5% to 15% = 10 points. Over 15% = 0 points.
    const activeSubscriptions = await this.subscriptionRepository.findAllByUser(userId);
    const subMonthlyCost = activeSubscriptions
      .filter(s => s.active)
      .reduce((s, sub) => {
        const amt = Number(sub.amount);
        if (sub.interval === 'monthly') return s + amt;
        if (sub.interval === 'weekly') return s + amt * 4;
        if (sub.interval === 'yearly') return s + amt / 12;
        return s + amt;
      }, 0);

    const subRatio = (subMonthlyCost / monthlyIncome) * 100;
    let subscriptionPoints = 20;
    if (subRatio > 15) {
      subscriptionPoints = 0;
    } else if (subRatio > 5) {
      subscriptionPoints = 10;
    }

    const financialHealthScore = Math.round(savingsPoints + investmentPoints + budgetPoints + subscriptionPoints);

    // 8. 6-Month Spending Trend for charts
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const start = startOfMonth(subMonths(today, i));
      const end = endOfMonth(subMonths(today, i));
      const sum = await this.expenseRepository.sumExpenses(userId, start, end);
      monthlyTrend.push({
        month: format(start, 'MMM'),
        expenses: sum,
      });
    }

    return {
      kpis: {
        currentMonthExpenses,
        prevMonthExpenses,
        avgDailySpend: Math.round(avgDailySpend * 100) / 100,
        expenseGrowth: Math.round(expenseGrowth * 100) / 100,
        highestSpendCategory: highestSpend.category,
        highestSpendAmount: highestSpend.amount,
        savingsAmount,
        savingsRate: Math.round(savingsRate * 100) / 100,
        monthlyIncome,
        incomeToSpendRatio,
        spendToIncomeRatio,
        totalInvested,
        totalCurrentValue,
        totalInvestmentReturns,
        investmentRatio: Math.round(investmentRatio * 100) / 100,
        expenseRatio: Math.round(expenseRatio * 100) / 100,
        financialHealthScore,
      },
      categoryTotals,
      monthlyTrend,
    };
  }
}
