import { prisma } from '../config/db';
import { WalletSplitPreset, Prisma } from '@prisma/client';

export class WalletPresetRepository {
  async createPreset(data: Prisma.WalletSplitPresetUncheckedCreateInput): Promise<WalletSplitPreset> {
    return prisma.walletSplitPreset.create({
      data,
    });
  }

  async findAllByWallet(walletId: string): Promise<WalletSplitPreset[]> {
    return prisma.walletSplitPreset.findMany({
      where: { walletId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(presetId: string): Promise<WalletSplitPreset | null> {
    return prisma.walletSplitPreset.findUnique({
      where: { id: presetId },
    });
  }

  async deletePreset(presetId: string): Promise<WalletSplitPreset> {
    return prisma.walletSplitPreset.delete({
      where: { id: presetId },
    });
  }
}
