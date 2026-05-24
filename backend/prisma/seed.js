"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Seeding database...');
    // Create hash passwords
    const salt = await bcrypt_1.default.genSalt(12);
    const adminPass = await bcrypt_1.default.hash('Admin@123', salt);
    const userPass = await bcrypt_1.default.hash('User@123', salt);
    const viewerPass = await bcrypt_1.default.hash('Viewer@123', salt);
    // 1. Create Users
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@finance.com' },
        update: {},
        create: {
            name: 'System Admin',
            email: 'admin@finance.com',
            passwordHash: adminPass,
            role: client_1.Role.ADMIN,
            emailVerified: true,
        },
    });
    const normalUser = await prisma.user.upsert({
        where: { email: 'user@finance.com' },
        update: {},
        create: {
            name: 'John Doe',
            email: 'user@finance.com',
            passwordHash: userPass,
            role: client_1.Role.USER,
            emailVerified: true,
        },
    });
    const viewerUser = await prisma.user.upsert({
        where: { email: 'viewer@finance.com' },
        update: {},
        create: {
            name: 'Jane Smith',
            email: 'viewer@finance.com',
            passwordHash: viewerPass,
            role: client_1.Role.VIEWER,
            emailVerified: true,
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
        { amount: 1500, category: client_1.ExpenseCategory.Rent, desc: 'Apartment rent payment', date: subDays(0), merchant: 'Renters Prop', payment: 'ACH' },
        { amount: 84.50, category: client_1.ExpenseCategory.Groceries, desc: 'Weekly food stock', date: subDays(1), merchant: 'Blinkit', payment: 'UPI' },
        { amount: 120.00, category: client_1.ExpenseCategory.Utilities, desc: 'Electricity monthly bill', date: subDays(2), merchant: 'Electricity Board', payment: 'Autopay' },
        { amount: 15.99, category: client_1.ExpenseCategory.Entertainment, desc: 'Monthly subscription', date: subDays(3), merchant: 'Netflix', payment: 'Credit Card' },
        { amount: 35.00, category: client_1.ExpenseCategory.Transport, desc: 'Office travel commute', date: subDays(4), merchant: 'Uber', payment: 'Credit Card' },
        { amount: 250.00, category: client_1.ExpenseCategory.Shopping, desc: 'New winter jacket', date: subDays(5), merchant: 'Amazon', payment: 'Debit Card' },
        { amount: 45.00, category: client_1.ExpenseCategory.Medical, desc: 'Prescription refills', date: subDays(7), merchant: 'CVS Pharmacy', payment: 'UPI' },
        { amount: 72.00, category: client_1.ExpenseCategory.Groceries, desc: 'Fresh food veggies', date: subDays(8), merchant: 'Blinkit', payment: 'UPI' },
        { amount: 550.00, category: client_1.ExpenseCategory.Travel, desc: 'Weekend getaway hotel', date: subDays(12), merchant: 'Booking.com', payment: 'Credit Card' },
        { amount: 300.00, category: client_1.ExpenseCategory.Education, desc: 'Web design course online', date: subDays(15), merchant: 'Udemy', payment: 'Paypal' },
        { amount: 80.00, category: client_1.ExpenseCategory.Utilities, desc: 'High-speed broadband', date: subDays(20), merchant: 'Comcast', payment: 'Autopay' },
        // Month -1 spending
        { amount: 1500, category: client_1.ExpenseCategory.Rent, desc: 'Apartment rent payment', date: subDays(30), merchant: 'Renters Prop', payment: 'ACH' },
        { amount: 92.00, category: client_1.ExpenseCategory.Groceries, desc: 'Weekly store buy', date: subDays(32), merchant: 'Blinkit', payment: 'UPI' },
        { amount: 110.00, category: client_1.ExpenseCategory.Utilities, desc: 'Power bill', date: subDays(33), merchant: 'Electricity Board', payment: 'Autopay' },
        { amount: 15.99, category: client_1.ExpenseCategory.Entertainment, desc: 'Monthly subscription', date: subDays(34), merchant: 'Netflix', payment: 'Credit Card' },
        { amount: 40.00, category: client_1.ExpenseCategory.Transport, desc: 'Cab ride to airport', date: subDays(35), merchant: 'Uber', payment: 'Credit Card' },
        { amount: 180.00, category: client_1.ExpenseCategory.Shopping, desc: 'Electronics tools', date: subDays(38), merchant: 'Amazon', payment: 'Debit Card' },
        // Month -2 spending
        { amount: 1500, category: client_1.ExpenseCategory.Rent, desc: 'Apartment rent payment', date: subDays(60), merchant: 'Renters Prop', payment: 'ACH' },
        { amount: 78.00, category: client_1.ExpenseCategory.Groceries, desc: 'Grocery run', date: subDays(62), merchant: 'Blinkit', payment: 'UPI' },
        { amount: 105.00, category: client_1.ExpenseCategory.Utilities, desc: 'Power bill', date: subDays(63), merchant: 'Electricity Board', payment: 'Autopay' },
        { amount: 15.99, category: client_1.ExpenseCategory.Entertainment, desc: 'Monthly subscription', date: subDays(64), merchant: 'Netflix', payment: 'Credit Card' },
        { amount: 32.00, category: client_1.ExpenseCategory.Transport, desc: 'Cab commute', date: subDays(65), merchant: 'Uber', payment: 'Credit Card' },
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
        { type: client_1.InvestmentType.Stocks, amount: 5000, rate: 8.5, start: subDays(300), cur: 5450, exp: 5400 },
        { type: client_1.InvestmentType.Mutual_Funds, amount: 3000, rate: 12.0, start: subDays(200), cur: 3200, exp: 3250 },
        { type: client_1.InvestmentType.Crypto, amount: 1000, rate: 25.0, start: subDays(100), cur: 1180, exp: 1200 },
        { type: client_1.InvestmentType.Fixed_Deposit, amount: 2000, rate: 6.5, start: subDays(50), cur: 2018, exp: 2065 },
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
        { name: 'Emergency Fund', target: 10000, cur: 4500, monthly: 500, returnRate: 4.5, targetDate: addMonths(new Date(), 12) },
        { name: 'Electric Car Fund', target: 35000, cur: 8000, monthly: 800, returnRate: 8.0, targetDate: addMonths(new Date(), 36) },
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
        { amount: 1600, category: client_1.ExpenseCategory.Rent, type: client_1.BudgetType.MONTHLY, start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
        { amount: 400, category: client_1.ExpenseCategory.Groceries, type: client_1.BudgetType.MONTHLY, start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
        { amount: 200, category: client_1.ExpenseCategory.Utilities, type: client_1.BudgetType.MONTHLY, start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
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
        { merchant: 'Netflix', amount: 15.99, category: client_1.ExpenseCategory.Entertainment, interval: 'monthly', lastDate: subDays(3), nextDate: addDays(new Date(), 27) },
        { merchant: 'Spotify', amount: 10.99, category: client_1.ExpenseCategory.Entertainment, interval: 'monthly', lastDate: subDays(15), nextDate: addDays(new Date(), 15) },
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
            amount: new Prisma.Decimal(150),
            description: 'Monthly electricity bill split',
            category: client_1.ExpenseCategory.Utilities,
            splitMethod: client_1.SplitMethod.EQUAL,
            splitDetails: JSON.stringify({
                [normalUser.id]: 75,
                [viewerUser.id]: 75,
            }),
            date: subDays(2),
        },
    });
    // Create a shared expense where Viewer User paid $50
    await prisma.sharedExpense.create({
        data: {
            walletId: wallet.id,
            paidById: viewerUser.id,
            amount: new Prisma.Decimal(50),
            description: 'Kitchen groceries split',
            category: client_1.ExpenseCategory.Groceries,
            splitMethod: client_1.SplitMethod.EQUAL,
            splitDetails: JSON.stringify({
                [normalUser.id]: 25,
                [viewerUser.id]: 25,
            }),
            date: subDays(1),
        },
    });
    // Add initial Notification
    await prisma.notification.create({
        data: {
            userId,
            message: 'Welcome to your Advanced Personal Finance Dashboard! Your verified account is active.',
            type: client_1.NotificationType.BILL_REMINDER,
        },
    });
    console.log('Seeding finished successfully.');
}
function subDays(days) {
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
