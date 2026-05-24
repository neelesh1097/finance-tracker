import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import expenseRoutes from './routes/expense.routes';
import investmentRoutes from './routes/investment.routes';
import goalRoutes from './routes/goal.routes';
import budgetRoutes from './routes/budget.routes';
import walletRoutes from './routes/wallet.routes';
import analyticsRoutes from './routes/analytics.routes';
import forecastRoutes from './routes/forecast.routes';
import subscriptionRoutes from './routes/subscription.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Trust reverse proxy headers (e.g. Render load balancer) for accurate client IP rate limiting
app.set('trust proxy', 1);

// Security middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting on API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
