import { prisma } from '../config/db';
import { Budget, Prisma, ExpenseCategory } from '@prisma/client';

export class BudgetRepository {
  async create(data: Prisma.BudgetUncheckedCreateInput): Promise<Budget> {
    return prisma.budget.create({
      data,
    });
  }

  async findById(id: string): Promise<Budget | null> {
    return prisma.budget.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.BudgetUpdateInput): Promise<Budget> {
    return prisma.budget.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Budget> {
    return prisma.budget.delete({
      where: { id },
    });
  }

  async findAllByUser(userId: string): Promise<Budget[]> {
    return prisma.budget.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findActiveBudgets(userId: string, date: Date): Promise<Budget[]> {
    return prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
  }

  async findActiveByCategory(userId: string, category: ExpenseCategory, date: Date): Promise<Budget[]> {
    return prisma.budget.findMany({
      where: {
        userId,
        budgetCategory: category,
        startDate: { lte: date },
        endDate: { gte: date },
      },
    });
  }
}
