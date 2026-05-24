import { prisma } from '../config/db';
import { Investment, Prisma } from '@prisma/client';

export class InvestmentRepository {
  async create(data: Prisma.InvestmentUncheckedCreateInput): Promise<Investment> {
    return prisma.investment.create({
      data,
    });
  }

  async findById(id: string): Promise<Investment | null> {
    return prisma.investment.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.InvestmentUpdateInput): Promise<Investment> {
    return prisma.investment.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Investment> {
    return prisma.investment.delete({
      where: { id },
    });
  }

  async findAllByUser(userId: string): Promise<Investment[]> {
    return prisma.investment.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
    });
  }

  async sumInvestments(userId: string): Promise<{
    totalInvested: number;
    totalCurrent: number;
  }> {
    const result = await prisma.investment.aggregate({
      where: { userId },
      _sum: {
        amount: true,
        currentValue: true,
      },
    });

    return {
      totalInvested: result._sum.amount ? Number(result._sum.amount) : 0,
      totalCurrent: result._sum.currentValue ? Number(result._sum.currentValue) : 0,
    };
  }
}
