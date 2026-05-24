import { Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class AnalyticsController {
  private analyticsService = new AnalyticsService();

  getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const analytics = await this.analyticsService.getDashboardAnalytics(userId);
      res.status(200).json({ success: true, data: analytics });
    } catch (err) {
      next(err);
    }
  };
}
