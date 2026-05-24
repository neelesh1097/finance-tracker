import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { expenseSchema } from '../utils/validationSchemas';
import multer from 'multer';

const router = Router();
const controller = new ExpenseController();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.post('/', validateBody(expenseSchema), controller.create);
router.get('/:id', controller.get);
router.put('/:id', validateBody(expenseSchema), controller.update);
router.delete('/:id', controller.delete);
router.get('/', controller.list);

router.post('/upload-statement', upload.single('file'), controller.uploadStatement);
router.post('/confirm-import', controller.confirmImport);

export default router;
