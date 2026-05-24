import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { walletSchema, walletInviteSchema, sharedExpenseSchema, splitPresetSchema } from '../utils/validationSchemas';

const router = Router();
const controller = new WalletController();

router.use(authenticate);

router.post('/', validateBody(walletSchema), controller.create);
router.get('/', controller.list);
router.post('/:walletId/invite', validateBody(walletInviteSchema), controller.invite);
router.post('/:walletId/expenses', validateBody(sharedExpenseSchema), controller.addExpense);
router.get('/:walletId/balances', controller.getBalances);

router.post('/:walletId/presets', validateBody(splitPresetSchema), controller.createPreset);
router.get('/:walletId/presets', controller.listPresets);
router.delete('/:walletId/presets/:presetId', controller.deletePreset);

export default router;
