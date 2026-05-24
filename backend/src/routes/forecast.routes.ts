import { Router } from 'express';
import { ForecastController } from '../controllers/forecast.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new ForecastController();

router.get('/', authenticate, controller.getForecast);

export default router;
