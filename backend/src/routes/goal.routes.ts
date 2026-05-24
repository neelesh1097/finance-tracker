import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { goalSchema } from '../utils/validationSchemas';

const router = Router();
const controller = new GoalController();

router.use(authenticate);

router.post('/', validateBody(goalSchema), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.put('/:id', validateBody(goalSchema), controller.update);
router.delete('/:id', controller.delete);

export default router;
