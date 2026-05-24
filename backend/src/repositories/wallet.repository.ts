import { prisma } from '../config/db';
import { Wallet, WalletMember, SharedExpense, Prisma } from '@prisma/client';

export class WalletRepository {
  async createWallet(name: string, ownerUserId: string): Promise<Wallet> {
    return prisma.wallet.create({
      data: {
        name,
        members: {
          create: {
            userId: ownerUserId,
            role: 'OWNER',
          },
        },
      },
      include: {
        members: true,
      },
    });
  }

  async findWalletById(walletId: string): Promise<(Wallet & { members: (WalletMember & { user: { name: string, email: string } })[] }) | null> {
    return prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async findUserWallets(userId: string): Promise<Wallet[]> {
    return prisma.wallet.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async addMember(walletId: string, userId: string, role: string): Promise<WalletMember> {
    return prisma.walletMember.create({
      data: {
        walletId,
        userId,
        role,
      },
    });
  }

  async removeMember(walletId: string, userId: string): Promise<WalletMember> {
    return prisma.walletMember.delete({
      where: {
        walletId_userId: {
          walletId,
          userId,
        },
      },
    });
  }

  async findMember(walletId: string, userId: string): Promise<WalletMember | null> {
    return prisma.walletMember.findUnique({
      where: {
        walletId_userId: {
          walletId,
          userId,
        },
      },
    });
  }

  async createSharedExpense(data: Prisma.SharedExpenseUncheckedCreateInput): Promise<SharedExpense> {
    return prisma.sharedExpense.create({
      data,
    });
  }

  async getSharedExpenses(walletId: string): Promise<(SharedExpense & { paidBy: { name: string, email: string } })[]> {
    return prisma.sharedExpense.findMany({
      where: { walletId },
      include: {
        paidBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }
}
