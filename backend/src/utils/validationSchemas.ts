import Joi from 'joi';

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  email: Joi.string().email().required(),
  password: Joi.string().regex(passwordPattern).required().messages({
    'string.pattern.base': 'Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Confirm password must match password',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().regex(passwordPattern).required().messages({
    'string.pattern.base': 'Password must be at least 8 characters long, contain at least one uppercase letter, one number, and one special character.',
  }),
});

export const expenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  category: Joi.string().valid(
    'Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping',
    'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other'
  ).required(),
  description: Joi.string().allow('').max(500),
  date: Joi.date().iso().required(),
  paymentMethod: Joi.string().required().max(50),
  merchantName: Joi.string().required().max(100),
  transactionSource: Joi.string().default('manual'),
  recurring: Joi.boolean().default(false),
  attachmentUrl: Joi.string().uri().allow('').max(500),
});

export const investmentSchema = Joi.object({
  amount: Joi.number().positive().required(),
  investmentType: Joi.string().valid(
    'Mutual_Funds', 'SIP', 'Stocks', 'Bonds', 'Fixed_Deposit', 'PPF', 'EPF', 'Crypto'
  ).required(),
  interestRate: Joi.number().min(0).max(100).required(),
  startDate: Joi.date().iso().required(),
  maturityDate: Joi.date().iso().allow(null),
  currentValue: Joi.number().min(0).required(),
  expectedValue: Joi.number().min(0).required(),
});

export const goalSchema = Joi.object({
  goalName: Joi.string().required().max(100),
  targetAmount: Joi.number().positive().required(),
  currentAmount: Joi.number().min(0).required(),
  monthlyContribution: Joi.number().min(0).required(),
  expectedAnnualReturn: Joi.number().min(0).max(100).required(),
  targetDate: Joi.date().iso().required(),
});

export const budgetSchema = Joi.object({
  budgetAmount: Joi.number().positive().required(),
  budgetCategory: Joi.string().valid(
    'Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping',
    'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other'
  ).required(),
  budgetType: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required(),
});

export const walletSchema = Joi.object({
  name: Joi.string().required().max(100),
});

export const walletInviteSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('MEMBER', 'VIEWER').default('MEMBER'),
});

export const sharedExpenseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  description: Joi.string().required().max(255),
  category: Joi.string().valid(
    'Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping',
    'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other'
  ).required(),
  splitMethod: Joi.string().valid('EQUAL', 'PERCENTAGE', 'CUSTOM').required(),
  splitDetails: Joi.object().pattern(Joi.string(), Joi.number()).required(),
  date: Joi.date().iso().required(),
});

export const splitPresetSchema = Joi.object({
  name: Joi.string().required().max(100),
  splitMethod: Joi.string().valid('EQUAL', 'PERCENTAGE', 'CUSTOM').required(),
  shares: Joi.object().pattern(Joi.string(), Joi.number()).required(),
});
