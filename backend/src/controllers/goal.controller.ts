import { Response, NextFunction } from 'express';
import { GoalService } from '../services/goal.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class GoalController {
  private goalService = new GoalService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const goal = await this.goalService.createGoal(userId, req.body);
      res.status(201).json({ success: true, data: goal });
    } catch (err) {
      next(err);
    }
  };

  get = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const goal = await this.goalService.getGoal(id, userId);
      res.status(200).json({ success: true, data: goal });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updated = await this.goalService.updateGoal(id, userId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await this.goalService.deleteGoal(id, userId);
      res.status(200).json({ success: true, message: 'Goal deleted successfully.' });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const result = await this.goalService.getGoalsAnalytics(userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
