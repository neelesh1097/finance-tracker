import { PrismaClient, Role, BudgetType, ExpenseCategory, InvestmentType, SplitMethod, NotificationType, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import { addDays, addMonths, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create hash passwords
  const salt = await bcrypt.genSalt(12);
  const adminPass = await bcrypt.hash('Admin@123', salt);
  const userPass = await bcrypt.hash('User@123', salt);
  const viewerPass = await bcrypt.hash('Viewer@123', salt);

  // 1. Create Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@finance.com' },
    update: { monthlyIncome: 100000.00 },
    create: {
      name: 'System Admin',
      email: 'admin@finance.com',
      passwordHash: adminPass,
      role: Role.ADMIN,
      emailVerified: true,
      monthlyIncome: 100000.00,
    },
  });

  const normalUser = await prisma.user.upsert({
    where: { email: 'user@finance.com' },
    update: { monthlyIncome: 75000.00 },
    create: {
      name: 'John Doe',
      email: 'user@finance.com',
      passwordHash: userPass,
      role: Role.USER,
      emailVerified: true,
      monthlyIncome: 75000.00,
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@finance.com' },
    update: { monthlyIncome: 50000.00 },
    create: {
      name: 'Jane Smith',
      email: 'viewer@finance.com',
      passwordHash: viewerPass,
      role: Role.VIEWER,
      emailVerified: true,
      monthlyIncome: 50000.00,
    },
  });

  const userId = normalUser.id;

  // Clear existing items for clean seed
  await prisma.expense.deleteMany({ where: { userId } });
  await prisma.investment.deleteMany({ where: { userId } });
  await prisma.goal.deleteMany({ where: { userId } });
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.subscription.deleteMany({ where: { userId } });
  await prisma.wallet.deleteMany({
    where: {
      members: {
        some: { userId }
      }
    }
  });

  // 2. Create Expenses (historical spanning 3 months for regression inputs)
  const expenseData = [
    { amount: 15000, category: ExpenseCategory.Rent, desc: 'Apartment rent payment', date: subDays(0), merchant: 'Renters Prop', payment: 'ACH' },
    { amount: 850.00, category: ExpenseCategory.Groceries, desc: 'Weekly food stock', date: subDays(1), merchant: 'Blinkit', payment: 'UPI' },
    { amount: 1200.00, category: ExpenseCategory.Utilities, desc: 'Electricity monthly bill', date: subDays(2), merchant: 'Electricity Board', payment: 'Autopay' },
    { amount: 649.00, category: ExpenseCategory.Entertainment, desc: 'Monthly subscription', date: subDays(3), merchant: 'Netflix', payment: 'Credit Card' },
    { amount: 350.00, category: ExpenseCategory.Transport, desc: 'Office travel commute', date: subDays(4), merchant: 'Uber', payment: 'Credit Card' },
    { amount: 2500.00, category: ExpenseCategory.Shopping, desc: 'New winter jacket', date: subDays(5), merchant: 'Amazon', payment: 'Debit Card' },
    { amount: 450.00, category: ExpenseCategory.Medical, desc: 'Prescription refills', date: subDays(7), merchant: 'CVS Pharmacy', payment: 'UPI' },
    { amount: 720.00, category: ExpenseCategory.Groceries, desc: 'Fresh food veggies', date: subDays(8), merchant: 'Blinkit', payment: 'UPI' },
    { amount: 5500.00, category: ExpenseCategory.Travel, desc: 'Weekend getaway hotel', date: subDays(12), merchant: 'Booking.com', payment: 'Credit Card' },
    { amount: 3000.00, category: ExpenseCategory.Education, desc: 'Web design course online', date: subDays(15), merchant: 'Udemy', payment: 'Paypal' },
    { amount: 800.00, category: ExpenseCategory.Utilities, desc: 'High-speed broadband', date: subDays(20), merchant: 'Comcast', payment: 'Autopay' },
    
    // Month -1 spending
    { amount: 15000, category: ExpenseCategory.Rent, desc: 'Apartment rent payment', date: subDays(30), merchant: 'Renters Prop', payment: 'ACH' },
    { amount: 920.00, category: ExpenseCategory.Groceries, desc: 'Weekly store buy', date: subDays(32), merchant: 'Blinkit', payment: 'UPI' },
    { amount: 1100.00, category: ExpenseCategory.Utilities, desc: 'Power bill', date: subDays(33), merchant: 'Electricity Board', payment: 'Autopay' },
    { amount: 649.00, category: ExpenseCategory.Entertainment, desc: 'Monthly subscription', date: subDays(34), merchant: 'Netflix', payment: 'Credit Card' },
    { amount: 400.00, category: ExpenseCategory.Transport, desc: 'Cab ride to airport', date: subDays(35), merchant: 'Uber', payment: 'Credit Card' },
    { amount: 1800.00, category: ExpenseCategory.Shopping, desc: 'Electronics tools', date: subDays(38), merchant: 'Amazon', payment: 'Debit Card' },

    // Month -2 spending
    { amount: 15000, category: ExpenseCategory.Rent, desc: 'Apartment rent payment', date: subDays(60), merchant: 'Renters Prop', payment: 'ACH' },
    { amount: 780.00, category: ExpenseCategory.Groceries, desc: 'Grocery run', date: subDays(62), merchant: 'Blinkit', payment: 'UPI' },
    { amount: 1050.00, category: ExpenseCategory.Utilities, desc: 'Power bill', date: subDays(63), merchant: 'Electricity Board', payment: 'Autopay' },
    { amount: 649.00, category: ExpenseCategory.Entertainment, desc: 'Monthly subscription', date: subDays(64), merchant: 'Netflix', payment: 'Credit Card' },
    { amount: 320.00, category: ExpenseCategory.Transport, desc: 'Cab commute', date: subDays(65), merchant: 'Uber', payment: 'Credit Card' },
  ];

  for (const exp of expenseData) {
    await prisma.expense.create({
      data: {
        userId,
        amount: new Prisma.Decimal(exp.amount),
        category: exp.category,
        description: exp.desc,
        date: exp.date,
        paymentMethod: exp.payment,
        merchantName: exp.merchant,
        transactionSource: 'manual',
      },
    });
  }

  // 3. Create Investments
  const investments = [
    { type: InvestmentType.Stocks, amount: 50000, rate: 8.5, start: subDays(300), cur: 54500, exp: 54000 },
    { type: InvestmentType.Mutual_Funds, amount: 30000, rate: 12.0, start: subDays(200), cur: 32000, exp: 32500 },
    { type: InvestmentType.Crypto, amount: 10000, rate: 25.0, start: subDays(100), cur: 11800, exp: 12000 },
    { type: InvestmentType.Fixed_Deposit, amount: 20000, rate: 6.5, start: subDays(50), cur: 20180, exp: 20650 },
  ];

  for (const inv of investments) {
    await prisma.investment.create({
      data: {
        userId,
        amount: new Prisma.Decimal(inv.amount),
        investmentType: inv.type,
        interestRate: new Prisma.Decimal(inv.rate),
        startDate: inv.start,
        currentValue: new Prisma.Decimal(inv.cur),
        expectedValue: new Prisma.Decimal(inv.exp),
      },
    });
  }

  // 4. Create Goals
  const goals = [
    { name: 'Emergency Fund', target: 100000, cur: 45000, monthly: 5000, returnRate: 4.5, targetDate: addMonths(new Date(), 12) },
    { name: 'Electric Car Fund', target: 350000, cur: 80000, monthly: 8000, returnRate: 8.0, targetDate: addMonths(new Date(), 36) },
  ];

  for (const g of goals) {
    await prisma.goal.create({
      data: {
        userId,
        goalName: g.name,
        targetAmount: new Prisma.Decimal(g.target),
        currentAmount: new Prisma.Decimal(g.cur),
        monthlyContribution: new Prisma.Decimal(g.monthly),
        expectedAnnualReturn: new Prisma.Decimal(g.returnRate),
        targetDate: g.targetDate,
      },
    });
  }

  // 5. Create Budgets
  const budgets = [
    { amount: 16000, category: ExpenseCategory.Rent, type: BudgetType.MONTHLY, start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    { amount: 4000, category: ExpenseCategory.Groceries, type: BudgetType.MONTHLY, start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
    { amount: 2000, category: ExpenseCategory.Utilities, type: BudgetType.MONTHLY, start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
  ];

  for (const b of budgets) {
    await prisma.budget.create({
      data: {
        userId,
        budgetAmount: new Prisma.Decimal(b.amount),
        budgetCategory: b.category,
        budgetType: b.type,
        startDate: b.start,
        endDate: b.end,
      },
    });
  }

  // 6. Create Subscriptions (which maps to Netflix and Spotify)
  const subscriptions = [
    { merchant: 'Netflix', amount: 649, category: ExpenseCategory.Entertainment, interval: 'monthly', lastDate: subDays(3), nextDate: addDays(new Date(), 27) },
    { merchant: 'Spotify', amount: 119, category: ExpenseCategory.Entertainment, interval: 'monthly', lastDate: subDays(15), nextDate: addDays(new Date(), 15) },
  ];

  for (const s of subscriptions) {
    await prisma.subscription.create({
      data: {
        userId,
        merchantName: s.merchant,
        amount: new Prisma.Decimal(s.amount),
        category: s.category,
        interval: s.interval,
        lastPaymentDate: s.lastDate,
        nextPaymentDate: s.nextDate,
      },
    });
  }

  // 7. Create Shared Wallet
  const wallet = await prisma.wallet.create({
    data: {
      name: 'Shared Apartment Bills',
      members: {
        createMany: {
          data: [
            { userId: normalUser.id, role: 'OWNER' },
            { userId: viewerUser.id, role: 'MEMBER' },
          ],
        },
      },
    },
  });

  // Create a shared expense where Normal User paid $150
  await prisma.sharedExpense.create({
    data: {
      walletId: wallet.id,
      paidById: normalUser.id,
      amount: new Prisma.Decimal(1500),
      description: 'Monthly electricity bill split',
      category: ExpenseCategory.Utilities,
      splitMethod: SplitMethod.EQUAL,
      splitDetails: JSON.stringify({
        [normalUser.id]: 750,
        [viewerUser.id]: 750,
      }),
      date: subDays(2),
    },
  });

  // Create a shared expense where Viewer User paid $50
  await prisma.sharedExpense.create({
    data: {
      walletId: wallet.id,
      paidById: viewerUser.id,
      amount: new Prisma.Decimal(500),
      description: 'Kitchen groceries split',
      category: ExpenseCategory.Groceries,
      splitMethod: SplitMethod.EQUAL,
      splitDetails: JSON.stringify({
        [normalUser.id]: 250,
        [viewerUser.id]: 250,
      }),
      date: subDays(1),
    },
  });

  // Add initial Notification
  await prisma.notification.create({
    data: {
      userId,
      message: 'Welcome to your Advanced Personal Finance Dashboard! Your verified account is active.',
      type: NotificationType.BILL_REMINDER,
    },
  });

  console.log('Seeding finished successfully.');
}

function subDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
