import { Router } from 'express';
import { InvestmentController } from '../controllers/investment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { investmentSchema } from '../utils/validationSchemas';

const router = Router();
const controller = new InvestmentController();

router.use(authenticate);

router.post('/', validateBody(investmentSchema), controller.create);
router.get('/portfolio', controller.getPortfolio);
router.get('/:id', controller.get);
router.put('/:id', validateBody(investmentSchema), controller.update);
router.delete('/:id', controller.delete);

export default router;
