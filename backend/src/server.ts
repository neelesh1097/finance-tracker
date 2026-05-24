import app from './app';
import { logger } from './config/logger';
import cron from 'node-cron';
import { prisma } from './config/db';
import { addDays, addMonths, addWeeks, addYears, startOfDay } from 'date-fns';
import { ExpenseCategory, NotificationType, Prisma } from '@prisma/client';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});

// Subscription renewal cron task: Runs daily at midnight
cron.schedule('0 0 * * *', async () => {
  logger.info('Running daily subscription renewal checks...');
  
  try {
    const today = startOfDay(new Date());

    // Find all active subscriptions that are due on or before today
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        active: true,
        nextPaymentDate: {
          lte: today,
        },
      },
    });

    logger.info(`Found ${dueSubscriptions.length} subscriptions due for renewal.`);

    for (const sub of dueSubscriptions) {
      // 1. Log an expense record for this renewal
      await prisma.expense.create({
        data: {
          userId: sub.userId,
          amount: sub.amount,
          category: sub.category,
          description: `Automatic renewal for subscription: ${sub.merchantName}`,
          date: today,
          paymentMethod: 'Subscription Autopay',
          merchantName: sub.merchantName,
          transactionSource: 'subscription_autopay',
          recurring: true,
        },
      });

      // 2. Compute the next payment date based on interval
      let nextPaymentDate = new Date(sub.nextPaymentDate);
      if (sub.interval === 'weekly') {
        nextPaymentDate = addWeeks(nextPaymentDate, 1);
      } else if (sub.interval === 'monthly') {
        nextPaymentDate = addMonths(nextPaymentDate, 1);
      } else if (sub.interval === 'yearly') {
        nextPaymentDate = addYears(nextPaymentDate, 1);
      } else {
        nextPaymentDate = addMonths(nextPaymentDate, 1); // default
      }

      // 3. Update subscription last/next payment dates
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          lastPaymentDate: sub.nextPaymentDate,
          nextPaymentDate,
        },
      });

      // 4. Fire user alert notification
      await prisma.notification.create({
        data: {
          userId: sub.userId,
          message: `Subscription for ${sub.merchantName} of ₹${Number(sub.amount).toFixed(2)} renewed successfully. Next payment due on ${formatDate(nextPaymentDate)}.`,
          type: NotificationType.SUBSCRIPTION_RENEWAL,
        },
      });

      logger.info(`Successfully renewed subscription: ${sub.merchantName} for user: ${sub.userId}`);
    }
  } catch (err: any) {
    logger.error(`Error in subscription renewal cron: ${err.message}`);
  }
});

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Graceful shutdowns
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received. Closing HTTP server...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
});
