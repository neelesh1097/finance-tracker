import { prisma } from '../config/db';
import { Expense, Prisma } from '@prisma/client';

export class ExpenseRepository {
  async create(data: Prisma.ExpenseUncheckedCreateInput): Promise<Expense> {
    return prisma.expense.create({
      data,
    });
  }

  async findById(id: string): Promise<Expense | null> {
    return prisma.expense.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.ExpenseUpdateInput): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Expense> {
    return prisma.expense.delete({
      where: { id },
    });
  }

  async findFiltered(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
      merchant?: string;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Expense[]> {
    const where = this.buildWhereClause(userId, filters);

    return prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: filters.limit ?? 20,
      skip: filters.offset ?? 0,
    });
  }

  async countFiltered(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      category?: string;
      merchant?: string;
      minAmount?: number;
      maxAmount?: number;
      search?: string;
    }
  ): Promise<number> {
    const where = this.buildWhereClause(userId, filters);
    return prisma.expense.count({ where });
  }

  async sumExpenses(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await prisma.expense.aggregate({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ? Number(result._sum.amount) : 0;
  }

  async getCategoryTotals(userId: string, startDate: Date, endDate: Date) {
    const result = await prisma.expense.groupBy({
      by: ['category'],
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result.map((r) => ({
      category: r.category,
      amount: r._sum.amount ? Number(r._sum.amount) : 0,
    }));
  }

  private buildWhereClause(userId: string, filters: any): Prisma.ExpenseWhereInput {
    const where: Prisma.ExpenseWhereInput = { userId };

    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.merchant) {
      where.merchantName = { contains: filters.merchant };
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.amount = {};
      if (filters.minAmount !== undefined) where.amount.gte = filters.minAmount;
      if (filters.maxAmount !== undefined) where.amount.lte = filters.maxAmount;
    }

    if (filters.search) {
      where.OR = [
        { description: { contains: filters.search } },
        { merchantName: { contains: filters.search } },
      ];
    }

    return where;
  }
}
