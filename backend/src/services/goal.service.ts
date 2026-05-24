import { GoalRepository } from '../repositories/goal.repository';
import { Prisma, Goal } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { addMonths, differenceInMonths } from 'date-fns';

export class GoalService {
  private goalRepository = new GoalRepository();

  async createGoal(userId: string, data: any): Promise<Goal> {
    return this.goalRepository.create({
      userId,
      goalName: data.goalName,
      targetAmount: new Prisma.Decimal(data.targetAmount),
      currentAmount: new Prisma.Decimal(data.currentAmount),
      monthlyContribution: new Prisma.Decimal(data.monthlyContribution),
      expectedAnnualReturn: new Prisma.Decimal(data.expectedAnnualReturn),
      targetDate: new Date(data.targetDate),
    });
  }

  async getGoal(id: string, userId: string): Promise<Goal> {
    const goal = await this.goalRepository.findById(id);
    if (!goal || goal.userId !== userId) {
      throw new AppError('Goal not found', 404);
    }
    return goal;
  }

  async updateGoal(id: string, userId: string, data: any): Promise<Goal> {
    await this.getGoal(id, userId);

    return this.goalRepository.update(id, {
      goalName: data.goalName || undefined,
      targetAmount: data.targetAmount ? new Prisma.Decimal(data.targetAmount) : undefined,
      currentAmount: data.currentAmount ? new Prisma.Decimal(data.currentAmount) : undefined,
      monthlyContribution: data.monthlyContribution ? new Prisma.Decimal(data.monthlyContribution) : undefined,
      expectedAnnualReturn: data.expectedAnnualReturn ? new Prisma.Decimal(data.expectedAnnualReturn) : undefined,
      targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
    });
  }

  async deleteGoal(id: string, userId: string): Promise<Goal> {
    await this.getGoal(id, userId);
    return this.goalRepository.delete(id);
  }

  async getGoalsAnalytics(userId: string) {
    const goals = await this.goalRepository.findAllByUser(userId);

    const analyzedGoals = goals.map((goal) => {
      const targetAmt = Number(goal.targetAmount);
      const currentAmt = Number(goal.currentAmount);
      const monthlyContribution = Number(goal.monthlyContribution);
      const annualReturn = Number(goal.expectedAnnualReturn) / 100;
      const targetDate = new Date(goal.targetDate);
      
      const completionPercentage = targetAmt > 0 ? (currentAmt / targetAmt) * 100 : 0;
      
      // Compounding monthly rate
      const r_monthly = Math.pow(1 + annualReturn, 1 / 12) - 1;

      // Simulate month-by-month trajectory to reach goal
      let currentSimulated = currentAmt;
      const trajectory: { month: number; amount: number }[] = [{ month: 0, amount: currentAmt }];
      let monthsNeeded = 0;
      const maxMonths = 360; // Max 30 years simulation cap

      while (currentSimulated < targetAmt && monthsNeeded < maxMonths) {
        monthsNeeded++;
        currentSimulated = (currentSimulated + monthlyContribution) * (1 + r_monthly);
        trajectory.push({
          month: monthsNeeded,
          amount: Math.round(currentSimulated * 100) / 100,
        });
      }

      const today = new Date();
      const projectedDate = addMonths(today, monthsNeeded);
      const monthsAvailable = differenceInMonths(targetDate, today);

      // Estimate completion probability
      let probability = 100;
      if (currentAmt >= targetAmt) {
        probability = 100;
      } else if (monthsNeeded >= maxMonths && currentSimulated < targetAmt) {
        probability = 0; // Will not reach with current savings rate
      } else {
        // Probability varies by how far the projected completion date is from target date
        const margin = monthsAvailable - monthsNeeded;
        if (margin >= 0) {
          probability = Math.min(100, 75 + (margin / monthsAvailable) * 25);
        } else {
          // If short, calculate ratio of target months vs needed months
          probability = Math.max(0, Math.round((monthsAvailable / monthsNeeded) * 70));
        }
      }

      return {
        ...goal,
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        monthlyContribution,
        expectedAnnualReturn: Number(goal.expectedAnnualReturn),
        completionPercentage,
        projectedCompletionMonths: monthsNeeded,
        projectedCompletionDate: projectedDate,
        targetMonthsAvailable: monthsAvailable,
        probability: Math.round(probability),
        trajectory: trajectory.slice(0, 24), // return first 2 years or until complete for charts
      };
    });

    return analyzedGoals;
  }
}
