import { Response, NextFunction } from 'express';
import { NotificationRepository } from '../repositories/notification.repository';
import { AuthRequest } from '../middlewares/auth.middleware';

export class NotificationController {
  private notificationRepository = new NotificationRepository();

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const notifications = await this.notificationRepository.findAllByUser(userId);
      res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  };

  read = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updated = await this.notificationRepository.markAsRead(id);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  readAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      await this.notificationRepository.markAllAsRead(userId);
      res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (err) {
      next(err);
    }
  };
}
