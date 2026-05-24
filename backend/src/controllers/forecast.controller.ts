import { Response, NextFunction } from 'express';
import { ForecastService } from '../services/forecast.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ForecastController {
  private forecastService = new ForecastService();

  getForecast = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const forecast = await this.forecastService.getForecastData(userId);
      res.status(200).json({ success: true, data: forecast });
    } catch (err) {
      next(err);
    }
  };
}
