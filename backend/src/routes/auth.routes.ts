import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validation.middleware';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../utils/validationSchemas';

const router = Router();
const controller = new AuthController();

router.post('/register', validateBody(registerSchema), controller.register);
router.post('/login', validateBody(loginSchema), controller.login);
router.post('/verify', controller.verifyEmail);
router.post('/resend-verification', controller.resendVerification);
router.post('/forgot-password', validateBody(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', validateBody(resetPasswordSchema), controller.resetPassword);
router.post('/refresh', controller.refresh);
router.post('/logout', authenticate, controller.logout);
router.put('/income', authenticate, controller.updateIncome);

export default router;
