import { Response, NextFunction } from 'express';
import { BudgetService } from '../services/budget.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class BudgetController {
  private budgetService = new BudgetService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const budget = await this.budgetService.createBudget(userId, req.body);
      res.status(201).json({ success: true, data: budget });
    } catch (err) {
      next(err);
    }
  };

  get = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const budget = await this.budgetService.getBudget(id, userId);
      res.status(200).json({ success: true, data: budget });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updated = await this.budgetService.updateBudget(id, userId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await this.budgetService.deleteBudget(id, userId);
      res.status(200).json({ success: true, message: 'Budget deleted successfully.' });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const result = await this.budgetService.getUserBudgetsWithUtilization(userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
