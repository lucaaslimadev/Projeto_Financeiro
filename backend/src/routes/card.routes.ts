import { Router } from 'express';
import { cardController } from '../controllers/card.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validate.js';
import { createCardSchema, updateCardSchema } from '../validators/card.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/', validateBody(createCardSchema), cardController.create);
router.get('/', cardController.list);
router.patch('/:id', validateBody(updateCardSchema), cardController.update);

export const cardRoutes = router;
