import { prisma } from '../config/db';
import { Subscription, Prisma } from '@prisma/client';

export class SubscriptionRepository {
  async create(data: Prisma.SubscriptionUncheckedCreateInput): Promise<Subscription> {
    return prisma.subscription.create({
      data,
    });
  }

  async findById(id: string): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.SubscriptionUpdateInput): Promise<Subscription> {
    return prisma.subscription.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Subscription> {
    return prisma.subscription.delete({
      where: { id },
    });
  }

  async findAllByUser(userId: string): Promise<Subscription[]> {
    return prisma.subscription.findMany({
      where: { userId },
      orderBy: { nextPaymentDate: 'asc' },
    });
  }

  async findUpcomingRenewals(days: number): Promise<Subscription[]> {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return prisma.subscription.findMany({
      where: {
        active: true,
        nextPaymentDate: {
          lte: targetDate,
          gte: new Date(),
        },
      },
    });
  }
}
