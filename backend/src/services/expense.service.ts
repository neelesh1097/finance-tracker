import { ExpenseRepository } from '../repositories/expense.repository';
import { BudgetRepository } from '../repositories/budget.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { Prisma, Expense, NotificationType, ExpenseCategory } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

export class ExpenseService {
  private expenseRepository = new ExpenseRepository();
  private budgetRepository = new BudgetRepository();
  private notificationRepository = new NotificationRepository();

  async createExpense(userId: string, data: any): Promise<Expense> {
    const expense = await this.expenseRepository.create({
      userId,
      amount: new Prisma.Decimal(data.amount),
      category: data.category,
      description: data.description,
      date: new Date(data.date),
      paymentMethod: data.paymentMethod,
      merchantName: data.merchantName,
      transactionSource: data.transactionSource || 'manual',
      recurring: data.recurring || false,
      attachmentUrl: data.attachmentUrl,
    });

    // Check budget status for this user in this category
    await this.checkBudgets(userId, data.category, new Date(data.date));

    return expense;
  }

  async getExpense(id: string, userId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense || expense.userId !== userId) {
      throw new AppError('Expense not found', 404);
    }
    return expense;
  }

  async updateExpense(id: string, userId: string, data: any): Promise<Expense> {
    const existing = await this.getExpense(id, userId);

    const updated = await this.expenseRepository.update(id, {
      amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
      category: data.category || undefined,
      description: data.description !== undefined ? data.description : undefined,
      date: data.date ? new Date(data.date) : undefined,
      paymentMethod: data.paymentMethod || undefined,
      merchantName: data.merchantName || undefined,
      recurring: data.recurring !== undefined ? data.recurring : undefined,
      attachmentUrl: data.attachmentUrl !== undefined ? data.attachmentUrl : undefined,
    });

    // Recheck budgets for the updated category and date
    const checkCategory = data.category || existing.category;
    const checkDate = data.date ? new Date(data.date) : existing.date;
    await this.checkBudgets(userId, checkCategory, checkDate);

    return updated;
  }

  async deleteExpense(id: string, userId: string): Promise<Expense> {
    await this.getExpense(id, userId); // throws if not owner
    return this.expenseRepository.delete(id);
  }

  async listExpenses(userId: string, filters: any) {
    const limit = filters.limit ? parseInt(filters.limit) : 20;
    const page = filters.page ? parseInt(filters.page) : 1;
    const offset = (page - 1) * limit;

    const queryFilters = {
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      category: filters.category,
      merchant: filters.merchant,
      minAmount: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
      maxAmount: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined,
      search: filters.search,
      limit,
      offset,
    };

    const items = await this.expenseRepository.findFiltered(userId, queryFilters);
    const total = await this.expenseRepository.countFiltered(userId, queryFilters);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  private async checkBudgets(userId: string, category: ExpenseCategory, date: Date): Promise<void> {
    const activeBudgets = await this.budgetRepository.findActiveByCategory(userId, category, date);
    
    for (const budget of activeBudgets) {
      const budgetAmount = Number(budget.budgetAmount);
      if (budgetAmount <= 0) continue;

      // Sum all expenses in this budget's category and date range
      const totalExpenses = await this.expenseRepository.sumExpenses(
        userId,
        budget.startDate,
        budget.endDate,
        budget.budgetCategory
      );

      const utilization = (totalExpenses / budgetAmount) * 100;

      if (utilization >= 100) {
        await this.notificationRepository.create(
          userId,
          `Alert: You have exceeded your budget of ₹${budgetAmount} for ${category}. Current spending: ₹${totalExpenses.toFixed(2)} (${utilization.toFixed(1)}%).`,
          NotificationType.BUDGET_ALERT
        );
      } else if (utilization >= 90) {
        await this.notificationRepository.create(
          userId,
          `Warning: You have utilized ${utilization.toFixed(1)}% of your ₹${budgetAmount} budget for ${category}. Spending: ₹${totalExpenses.toFixed(2)}.`,
          NotificationType.BUDGET_ALERT
        );
      } else if (utilization >= 75) {
        await this.notificationRepository.create(
          userId,
          `Notice: Your budget of ₹${budgetAmount} for ${category} is at ${utilization.toFixed(1)}% usage. Spent: ₹${totalExpenses.toFixed(2)}.`,
          NotificationType.BUDGET_ALERT
        );
      }
    }
  }
}
