import { Router } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const controller = new SubscriptionController();

router.use(authenticate);

router.post('/', controller.create);
router.get('/', controller.list);
router.get('/detect', controller.detect);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
