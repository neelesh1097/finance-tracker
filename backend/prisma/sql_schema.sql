-- SQL DDL schema as source of truth

CREATE TABLE IF NOT EXISTS Users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'USER', 'VIEWER') DEFAULT 'USER',
  emailVerified BOOLEAN DEFAULT FALSE,
  verificationToken VARCHAR(255),
  verificationTokenExp DATETIME,
  resetToken VARCHAR(255),
  resetTokenExp DATETIME,
  refreshToken TEXT,
  monthlyIncome DECIMAL(15, 2) DEFAULT 50000.00,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Expenses (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  category ENUM('Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping', 'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other') NOT NULL,
  description VARCHAR(500),
  date DATETIME NOT NULL,
  paymentMethod VARCHAR(50) NOT NULL,
  merchantName VARCHAR(100) NOT NULL,
  transactionSource VARCHAR(50) NOT NULL,
  recurring BOOLEAN DEFAULT FALSE,
  attachmentUrl VARCHAR(500),
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_expenses_userId (userId),
  INDEX idx_expenses_date (date),
  INDEX idx_expenses_category (category)
);

CREATE TABLE IF NOT EXISTS Investments (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  investmentType ENUM('Mutual_Funds', 'SIP', 'Stocks', 'Bonds', 'Fixed_Deposit', 'PPF', 'EPF', 'Crypto') NOT NULL,
  interestRate DECIMAL(5, 2) NOT NULL,
  startDate DATETIME NOT NULL,
  maturityDate DATETIME,
  currentValue DECIMAL(15, 2) NOT NULL,
  expectedValue DECIMAL(15, 2) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_investments_userId (userId)
);

CREATE TABLE IF NOT EXISTS Goals (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  goalName VARCHAR(100) NOT NULL,
  targetAmount DECIMAL(15, 2) NOT NULL,
  currentAmount DECIMAL(15, 2) NOT NULL,
  monthlyContribution DECIMAL(15, 2) NOT NULL,
  expectedAnnualReturn DECIMAL(5, 2) NOT NULL,
  targetDate DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_goals_userId (userId)
);

CREATE TABLE IF NOT EXISTS Budgets (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  budgetAmount DECIMAL(15, 2) NOT NULL,
  budgetCategory ENUM('Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping', 'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other') NOT NULL,
  budgetType ENUM('DAILY', 'WEEKLY', 'MONTHLY') NOT NULL,
  startDate DATETIME NOT NULL,
  endDate DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_budgets_userId (userId)
);

CREATE TABLE IF NOT EXISTS Subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  merchantName VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  category ENUM('Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping', 'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other') NOT NULL,
  `interval` VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  lastPaymentDate DATETIME NOT NULL,
  nextPaymentDate DATETIME NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_subscriptions_userId (userId)
);

CREATE TABLE IF NOT EXISTS Wallets (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS WalletMembers (
  id VARCHAR(36) PRIMARY KEY,
  walletId VARCHAR(36) NOT NULL,
  userId VARCHAR(36) NOT NULL,
  role VARCHAR(20) NOT NULL, -- 'OWNER', 'MEMBER', 'VIEWER'
  joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (walletId) REFERENCES Wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_wallet_user (walletId, userId)
);

CREATE TABLE IF NOT EXISTS SharedExpenses (
  id VARCHAR(36) PRIMARY KEY,
  walletId VARCHAR(36) NOT NULL,
  paidById VARCHAR(36) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  category ENUM('Rent', 'Groceries', 'Utilities', 'Transport', 'Shopping', 'Entertainment', 'Education', 'Medical', 'Travel', 'Investments', 'Other') NOT NULL,
  splitMethod ENUM('EQUAL', 'PERCENTAGE', 'CUSTOM') NOT NULL,
  splitDetails TEXT NOT NULL, -- JSON mapping userId -> amount/percentage
  date DATETIME NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (walletId) REFERENCES Wallets(id) ON DELETE CASCADE,
  FOREIGN KEY (paidById) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_sharedexpenses_walletId (walletId)
);

CREATE TABLE IF NOT EXISTS Forecasts (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  monthEndDate DATETIME NOT NULL,
  predictedBalance DECIMAL(15, 2) NOT NULL,
  predictedOverspend DECIMAL(15, 2) NOT NULL,
  categoryForecasts TEXT NOT NULL, -- JSON object mapping categories to decimal values
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_forecasts_userId (userId)
);

CREATE TABLE IF NOT EXISTS Notifications (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  message VARCHAR(500) NOT NULL,
  type ENUM('BUDGET_ALERT', 'GOAL_MILESTONE', 'SUBSCRIPTION_RENEWAL', 'BILL_REMINDER', 'INVESTMENT_MATURITY') NOT NULL,
  `read` BOOLEAN DEFAULT FALSE,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
  INDEX idx_notifications_userId (userId)
);

CREATE TABLE IF NOT EXISTS AuditLogs (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36),
  action VARCHAR(255) NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE SET NULL,
  INDEX idx_auditlogs_userId (userId)
);
