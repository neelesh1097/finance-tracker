import { BudgetRepository } from '../repositories/budget.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { Budget, Prisma } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';

export class BudgetService {
  private budgetRepository = new BudgetRepository();
  private expenseRepository = new ExpenseRepository();

  async createBudget(userId: string, data: any): Promise<Budget> {
    return this.budgetRepository.create({
      userId,
      budgetAmount: new Prisma.Decimal(data.budgetAmount),
      budgetCategory: data.budgetCategory,
      budgetType: data.budgetType,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });
  }

  async getBudget(id: string, userId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findById(id);
    if (!budget || budget.userId !== userId) {
      throw new AppError('Budget not found', 404);
    }
    return budget;
  }

  async updateBudget(id: string, userId: string, data: any): Promise<Budget> {
    await this.getBudget(id, userId);

    return this.budgetRepository.update(id, {
      budgetAmount: data.budgetAmount ? new Prisma.Decimal(data.budgetAmount) : undefined,
      budgetCategory: data.budgetCategory || undefined,
      budgetType: data.budgetType || undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    });
  }

  async deleteBudget(id: string, userId: string): Promise<Budget> {
    await this.getBudget(id, userId);
    return this.budgetRepository.delete(id);
  }

  async getUserBudgetsWithUtilization(userId: string) {
    const budgets = await this.budgetRepository.findAllByUser(userId);
    const result = [];

    for (const b of budgets) {
      const spent = await this.expenseRepository.sumExpenses(
        userId,
        b.startDate,
        b.endDate,
        b.budgetCategory
      );

      const budgetAmount = Number(b.budgetAmount);
      const remaining = budgetAmount - spent;
      const utilization = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;

      result.push({
        ...b,
        budgetAmount,
        spent,
        remaining,
        utilization: Math.round(utilization * 100) / 100,
      });
    }

    return result;
  }
}
