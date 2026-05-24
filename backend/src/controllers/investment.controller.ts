import { Response, NextFunction } from 'express';
import { InvestmentService } from '../services/investment.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class InvestmentController {
  private investmentService = new InvestmentService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const investment = await this.investmentService.createInvestment(userId, req.body);
      res.status(201).json({ success: true, data: investment });
    } catch (err) {
      next(err);
    }
  };

  get = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const investment = await this.investmentService.getInvestment(id, userId);
      res.status(200).json({ success: true, data: investment });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const updated = await this.investmentService.updateInvestment(id, userId, req.body);
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await this.investmentService.deleteInvestment(id, userId);
      res.status(200).json({ success: true, message: 'Investment deleted successfully.' });
    } catch (err) {
      next(err);
    }
  };

  getPortfolio = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const portfolio = await this.investmentService.getPortfolioSummary(userId);
      res.status(200).json({ success: true, data: portfolio });
    } catch (err) {
      next(err);
    }
  };
}
