import { SubscriptionRepository } from '../repositories/subscription.repository';
import { ExpenseRepository } from '../repositories/expense.repository';
import { Subscription, Prisma, Expense } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { differenceInDays } from 'date-fns';

export class SubscriptionService {
  private subscriptionRepository = new SubscriptionRepository();
  private expenseRepository = new ExpenseRepository();

  async createSubscription(userId: string, data: any): Promise<Subscription> {
    return this.subscriptionRepository.create({
      userId,
      merchantName: data.merchantName,
      amount: new Prisma.Decimal(data.amount),
      category: data.category,
      interval: data.interval,
      lastPaymentDate: new Date(data.lastPaymentDate),
      nextPaymentDate: new Date(data.nextPaymentDate),
      active: data.active !== undefined ? data.active : true,
    });
  }

  async getSubscription(id: string, userId: string): Promise<Subscription> {
    const sub = await this.subscriptionRepository.findById(id);
    if (!sub || sub.userId !== userId) {
      throw new AppError('Subscription not found', 404);
    }
    return sub;
  }

  async updateSubscription(id: string, userId: string, data: any): Promise<Subscription> {
    await this.getSubscription(id, userId);

    return this.subscriptionRepository.update(id, {
      merchantName: data.merchantName || undefined,
      amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
      category: data.category || undefined,
      interval: data.interval || undefined,
      lastPaymentDate: data.lastPaymentDate ? new Date(data.lastPaymentDate) : undefined,
      nextPaymentDate: data.nextPaymentDate ? new Date(data.nextPaymentDate) : undefined,
      active: data.active !== undefined ? data.active : undefined,
    });
  }

  async deleteSubscription(id: string, userId: string): Promise<Subscription> {
    await this.getSubscription(id, userId);
    return this.subscriptionRepository.delete(id);
  }

  async listSubscriptions(userId: string): Promise<Subscription[]> {
    return this.subscriptionRepository.findAllByUser(userId);
  }

  // Scans history to identify periodic expenses
  async detectRecurringSubscriptions(userId: string) {
    const expenses = await this.expenseRepository.findFiltered(userId, { limit: 1000 });
    
    // Group expenses by merchant name (case-insensitive, trimmed)
    const grouped: Record<string, Expense[]> = {};
    for (const exp of expenses) {
      const merchant = exp.merchantName.toLowerCase().trim();
      if (!grouped[merchant]) {
        grouped[merchant] = [];
      }
      grouped[merchant].push(exp);
    }

    const detected = [];
    const existingSubs = await this.subscriptionRepository.findAllByUser(userId);
    const existingMerchants = new Set(existingSubs.map(s => s.merchantName.toLowerCase().trim()));

    for (const [merchant, merchantExpenses] of Object.entries(grouped)) {
      // Skip if already tracked
      if (existingMerchants.has(merchant)) continue;
      
      // Need at least 3 transactions to detect a subscription frequency
      if (merchantExpenses.length < 3) continue;

      // Sort by date ascending
      const sorted = [...merchantExpenses].sort((a, b) => a.date.getTime() - b.date.getTime());

      // Check amount variance: all amounts must be within 15% of the average
      const amounts = sorted.map(e => Number(e.amount));
      const avgAmount = amounts.reduce((s, val) => s + val, 0) / amounts.length;
      const amountVariance = amounts.every(amt => Math.abs(amt - avgAmount) / avgAmount < 0.15);

      if (!amountVariance) continue;

      // Check periodic intervals
      const intervals = [];
      for (let i = 1; i < sorted.length; i++) {
        intervals.push(differenceInDays(new Date(sorted[i].date), new Date(sorted[i - 1].date)));
      }

      const avgInterval = intervals.reduce((s, val) => s + val, 0) / intervals.length;
      
      // Check interval variance (differences should not fluctuate by more than 4 days)
      const intervalConsistency = intervals.every(days => Math.abs(days - avgInterval) <= 4);

      if (intervalConsistency) {
        let intervalString = '';
        let nextPaymentDate = new Date();

        if (avgInterval >= 6 && avgInterval <= 8) {
          intervalString = 'weekly';
          nextPaymentDate.setDate(sorted[sorted.length - 1].date.getDate() + 7);
        } else if (avgInterval >= 27 && avgInterval <= 32) {
          intervalString = 'monthly';
          nextPaymentDate.setMonth(sorted[sorted.length - 1].date.getMonth() + 1);
        } else if (avgInterval >= 350 && avgInterval <= 375) {
          intervalString = 'yearly';
          nextPaymentDate.setFullYear(sorted[sorted.length - 1].date.getFullYear() + 1);
        }

        if (intervalString) {
          detected.push({
            merchantName: sorted[0].merchantName, // original capitalized
            amount: avgAmount,
            category: sorted[0].category,
            interval: intervalString,
            lastPaymentDate: sorted[sorted.length - 1].date,
            nextPaymentDate,
            confidence: 0.9,
          });
        }
      }
    }

    return detected;
  }
}
