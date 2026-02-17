import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/balance', dashboardController.getBalance);
router.patch('/balance', dashboardController.updateBalance);
router.get('/bills-due', dashboardController.billsDue);
router.get('/overdue', dashboardController.overdue);
router.get('/month-total', dashboardController.monthTotal);
router.get('/spending-by-category', dashboardController.spendingByCategory);
router.get('/invoice-by-card', dashboardController.invoiceByCard);
router.get('/alerts', dashboardController.alerts);
router.get('/year-report', dashboardController.yearReport);

export const dashboardRoutes = router;
