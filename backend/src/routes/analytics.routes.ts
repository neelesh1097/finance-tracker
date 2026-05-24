import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new AnalyticsController();

router.get('/dashboard', authenticate, controller.getDashboard);

export default router;
