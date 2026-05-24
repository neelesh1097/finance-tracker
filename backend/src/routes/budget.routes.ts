import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { budgetSchema } from '../utils/validationSchemas';

const router = Router();
const controller = new BudgetController();

router.use(authenticate);

router.post('/', validateBody(budgetSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.put('/:id', validateBody(budgetSchema), controller.update);
router.delete('/:id', controller.delete);

export default router;
