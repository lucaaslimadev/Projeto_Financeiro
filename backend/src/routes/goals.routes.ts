import { Router } from 'express';
import { goalsController } from '../controllers/goals.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', goalsController.list);
router.post('/', goalsController.setGoal);
router.delete('/', goalsController.removeGoal);

export const goalsRoutes = router;
