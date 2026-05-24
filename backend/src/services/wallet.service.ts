import { WalletRepository } from '../repositories/wallet.repository';
import { UserRepository } from '../repositories/user.repository';
import { WalletPresetRepository } from '../repositories/walletPreset.repository';
import { AppError } from '../middlewares/error.middleware';
import { Prisma, SplitMethod } from '@prisma/client';
import { simplifyDebts } from '../utils/debtSimplifier';

export class WalletService {
  private walletRepository = new WalletRepository();
  private userRepository = new UserRepository();
  private walletPresetRepository = new WalletPresetRepository();

  async createWallet(name: string, userId: string) {
    return this.walletRepository.createWallet(name, userId);
  }

  async getWalletDetails(walletId: string, userId: string) {
    const member = await this.walletRepository.findMember(walletId, userId);
    if (!member) {
      throw new AppError('Access Denied. You are not a member of this wallet.', 403);
    }
    return this.walletRepository.findWalletById(walletId);
  }

  async inviteMemberByEmail(walletId: string, inviterId: string, inviteeEmail: string, role: string) {
    // Check if inviter is OWNER or MEMBER (VIEWERs cannot invite)
    const inviter = await this.walletRepository.findMember(walletId, inviterId);
    if (!inviter || inviter.role === 'VIEWER') {
      throw new AppError('Forbidden: Only wallet owners and members can invite others.', 403);
    }

    const invitee = await this.userRepository.findByEmail(inviteeEmail);
    if (!invitee) {
      throw new AppError(`User with email ${inviteeEmail} not found. They must register first.`, 404);
    }

    const existingMember = await this.walletRepository.findMember(walletId, invitee.id);
    if (existingMember) {
      throw new AppError('User is already a member of this wallet.', 400);
    }

    return this.walletRepository.addMember(walletId, invitee.id, role);
  }

  async listUserWallets(userId: string) {
    return this.walletRepository.findUserWallets(userId);
  }

  async addExpense(walletId: string, paidById: string, data: any) {
    const member = await this.walletRepository.findMember(walletId, paidById);
    if (!member || member.role === 'VIEWER') {
      throw new AppError('Forbidden: Only wallet owners and members can log transactions.', 403);
    }

    // Split Details validation
    const amount = Number(data.amount);
    const splitMethod = data.splitMethod as SplitMethod;
    const splitDetails = data.splitDetails; // Record<userId, value>

    const wallet = await this.walletRepository.findWalletById(walletId);
    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    // Verify split details sum up to amount/percentage
    const memberIds = wallet.members.map(m => m.userId);
    const splitKeys = Object.keys(splitDetails);
    
    // Check all split keys are active wallet members
    for (const key of splitKeys) {
      if (!memberIds.includes(key)) {
        throw new AppError(`User ${key} is not a member of this wallet.`, 400);
      }
    }

    let calculatedSplits: Record<string, number> = {};

    if (splitMethod === SplitMethod.EQUAL) {
      // Divide equally among participating members listed in splitDetails keys
      const share = amount / splitKeys.length;
      splitKeys.forEach(k => {
        calculatedSplits[k] = Math.round(share * 100) / 100;
      });
    } else if (splitMethod === SplitMethod.PERCENTAGE) {
      let percentSum = 0;
      splitKeys.forEach(k => {
        const pct = Number(splitDetails[k]);
        percentSum += pct;
        calculatedSplits[k] = Math.round((pct / 100) * amount * 100) / 100;
      });
      if (Math.abs(percentSum - 100) > 0.1) {
        throw new AppError('Percentages must sum up to exactly 100%', 400);
      }
    } else if (splitMethod === SplitMethod.CUSTOM) {
      let sum = 0;
      splitKeys.forEach(k => {
        const val = Number(splitDetails[k]);
        sum += val;
        calculatedSplits[k] = val;
      });
      if (Math.abs(sum - amount) > 0.05) {
        throw new AppError('Custom split amounts must sum up to the total expense amount', 400);
      }
    }

    return this.walletRepository.createSharedExpense({
      walletId,
      paidById,
      amount: new Prisma.Decimal(amount),
      description: data.description,
      category: data.category,
      splitMethod,
      splitDetails: JSON.stringify(calculatedSplits),
      date: new Date(data.date),
    });
  }

  async getBalancesAndSettlements(walletId: string, userId: string) {
    const member = await this.walletRepository.findMember(walletId, userId);
    if (!member) {
      throw new AppError('Access Denied', 403);
    }

    const wallet = await this.walletRepository.findWalletById(walletId);
    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    const expenses = await this.walletRepository.getSharedExpenses(walletId);
    
    // Net balance mapping: userId -> balance
    const balances: Record<string, number> = {};
    
    // Initialize
    wallet.members.forEach(m => {
      balances[m.userId] = 0;
    });

    expenses.forEach(exp => {
      const totalAmount = Number(exp.amount);
      const payerId = exp.paidById;
      const splits = JSON.parse(exp.splitDetails) as Record<string, number>;

      // Add to payer's credit balance
      if (balances[payerId] !== undefined) {
        balances[payerId] += totalAmount;
      }

      // Subtract from debtor balances
      Object.entries(splits).forEach(([debtorId, share]) => {
        if (balances[debtorId] !== undefined) {
          balances[debtorId] -= share;
        }
      });
    });

    // Simplify the ledger using min-max matching algorithm
    const simplifiedSettlements = simplifyDebts(balances);

    // Map user names to settlements
    const userMap: Record<string, string> = {};
    wallet.members.forEach(m => {
      userMap[m.userId] = m.user.name;
    });

    const displaySettlements = simplifiedSettlements.map(s => ({
      fromId: s.from,
      fromName: userMap[s.from] || 'Unknown',
      toId: s.to,
      toName: userMap[s.to] || 'Unknown',
      amount: s.amount,
    }));

    const membersWithBalances = wallet.members.map(m => ({
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      balance: Math.round((balances[m.userId] || 0) * 100) / 100,
    }));

    const presets = await this.walletPresetRepository.findAllByWallet(walletId);

    return {
      walletName: wallet.name,
      members: membersWithBalances,
      settlements: displaySettlements,
      expenses: expenses.map(exp => ({
        ...exp,
        amount: Number(exp.amount),
        splitDetails: JSON.parse(exp.splitDetails),
      })),
      presets: presets.map(p => ({
        ...p,
        shares: JSON.parse(p.shares),
      })),
    };
  }

  async createPreset(walletId: string, userId: string, data: any) {
    const member = await this.walletRepository.findMember(walletId, userId);
    if (!member || member.role === 'VIEWER') {
      throw new AppError('Forbidden: Only wallet owners and members can create split presets.', 403);
    }

    const wallet = await this.walletRepository.findWalletById(walletId);
    if (!wallet) {
      throw new AppError('Wallet not found', 404);
    }

    const memberIds = wallet.members.map(m => m.userId);
    const shares = data.shares;
    const splitMethod = data.splitMethod as SplitMethod;

    // Validate that all share keys are wallet members
    for (const key of Object.keys(shares)) {
      if (!memberIds.includes(key)) {
        throw new AppError(`User ${key} is not a member of this wallet.`, 400);
      }
    }

    // Verify percentages sum to 100%
    if (splitMethod === SplitMethod.PERCENTAGE) {
      let percentSum = 0;
      Object.values(shares).forEach((pct: any) => {
        percentSum += Number(pct);
      });
      if (Math.abs(percentSum - 100) > 0.1) {
        throw new AppError('Percentages must sum up to exactly 100%', 400);
      }
    }

    return this.walletPresetRepository.createPreset({
      walletId,
      name: data.name,
      splitMethod,
      shares: JSON.stringify(shares),
    });
  }

  async listPresets(walletId: string, userId: string) {
    const member = await this.walletRepository.findMember(walletId, userId);
    if (!member) {
      throw new AppError('Access Denied. You are not a member of this wallet.', 403);
    }

    const presets = await this.walletPresetRepository.findAllByWallet(walletId);
    return presets.map(p => ({
      ...p,
      shares: JSON.parse(p.shares),
    }));
  }

  async deletePreset(walletId: string, presetId: string, userId: string) {
    const member = await this.walletRepository.findMember(walletId, userId);
    if (!member || member.role === 'VIEWER') {
      throw new AppError('Forbidden: Only wallet owners and members can delete split presets.', 403);
    }

    const preset = await this.walletPresetRepository.findById(presetId);
    if (!preset || preset.walletId !== walletId) {
      throw new AppError('Preset not found in this wallet.', 404);
    }

    return this.walletPresetRepository.deletePreset(presetId);
  }
}
