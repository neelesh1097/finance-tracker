import { prisma } from '../config/db';
import { Goal, Prisma } from '@prisma/client';

export class GoalRepository {
  async create(data: Prisma.GoalUncheckedCreateInput): Promise<Goal> {
    return prisma.goal.create({
      data,
    });
  }

  async findById(id: string): Promise<Goal | null> {
    return prisma.goal.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.GoalUpdateInput): Promise<Goal> {
    return prisma.goal.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Goal> {
    return prisma.goal.delete({
      where: { id },
    });
  }

  async findAllByUser(userId: string): Promise<Goal[]> {
    return prisma.goal.findMany({
      where: { userId },
      orderBy: { targetDate: 'asc' },
    });
  }
}
