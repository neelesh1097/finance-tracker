import { Response, NextFunction } from 'express';
import { SubscriptionService } from '../services/subscription.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class SubscriptionController {
  private subscriptionService = new SubscriptionService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const sub = await this.subscriptionService.createSubscription(userId, req.body);
      res.status(201).json({ success: true, data: sub });
    } catch (err) {
      next(err);
    }
  };

  get = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const sub = await this.subscriptionService.getSubscription(id, userId);
      res.status(200).json({ success: true, data: sub });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updated = await this.subscriptionService.updateSubscription(id, userId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await this.subscriptionService.deleteSubscription(id, userId);
      res.status(200).json({ success: true, message: 'Subscription deleted successfully.' });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const subs = await this.subscriptionService.listSubscriptions(userId);
      res.status(200).json({ success: true, data: subs });
    } catch (err) {
      next(err);
    }
  };

  detect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const detected = await this.subscriptionService.detectRecurringSubscriptions(userId);
      res.status(200).json({ success: true, data: detected });
    } catch (err) {
      next(err);
    }
  };
}
