import { Response, NextFunction } from 'express';
import { WalletService } from '../services/wallet.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class WalletController {
  private walletService = new WalletService();

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { name } = req.body;
      const wallet = await this.walletService.createWallet(name, userId);
      res.status(201).json({ success: true, data: wallet });
    } catch (err) {
      next(err);
    }
  };

  invite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const inviterId = req.user!.id;
      const { walletId } = req.params;
      const { email, role } = req.body;
      const result = await this.walletService.inviteMemberByEmail(walletId, inviterId, email, role || 'MEMBER');
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  list = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const wallets = await this.walletService.listUserWallets(userId);
      res.status(200).json({ success: true, data: wallets });
    } catch (err) {
      next(err);
    }
  };

  addExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const paidById = req.user!.id;
      const { walletId } = req.params;
      const expense = await this.walletService.addExpense(walletId, paidById, req.body);
      res.status(201).json({ success: true, data: expense });
    } catch (err) {
      next(err);
    }
  };

  getBalances = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { walletId } = req.params;
      const details = await this.walletService.getBalancesAndSettlements(walletId, userId);
      res.status(200).json({ success: true, data: details });
    } catch (err) {
      next(err);
    }
  };

  createPreset = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { walletId } = req.params;
      const preset = await this.walletService.createPreset(walletId, userId, req.body);
      res.status(201).json({ success: true, data: preset });
    } catch (err) {
      next(err);
    }
  };

  listPresets = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { walletId } = req.params;
      const presets = await this.walletService.listPresets(walletId, userId);
      res.status(200).json({ success: true, data: presets });
    } catch (err) {
      next(err);
    }
  };

  deletePreset = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { walletId, presetId } = req.params;
      const result = await this.walletService.deletePreset(walletId, presetId, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };
}
