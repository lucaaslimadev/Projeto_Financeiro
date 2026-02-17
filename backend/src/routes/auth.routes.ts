import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { authMiddleware } from '../middlewares/auth.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';

const router = Router();

router.use(authLimiter);

router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', validateBody(loginSchema), authController.login);
router.post('/telegram-link-code', authMiddleware, authController.telegramLinkCode);

export const authRoutes = router;
