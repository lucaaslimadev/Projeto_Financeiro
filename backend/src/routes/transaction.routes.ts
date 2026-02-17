import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller.js';
import { authMiddleware } from '../middlewares/auth.js';
import { validateBody, validateQuery } from '../middlewares/validate.js';
import {
  createTransactionSimpleSchema,
  createIncomeSchema,
  createRecurringFixedSchema,
  createVariableExpenseSchema,
  createInstallmentCardSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from '../validators/transaction.validator.js';

const router = Router();

router.use(authMiddleware);

router.post('/simple', validateBody(createTransactionSimpleSchema), transactionController.createSimple);
router.post('/income', validateBody(createIncomeSchema), transactionController.createIncome);
router.post('/recurring-fixed', validateBody(createRecurringFixedSchema), transactionController.createRecurringFixed);
router.post('/variable', validateBody(createVariableExpenseSchema), transactionController.createVariableExpense);
router.post('/installment-card', validateBody(createInstallmentCardSchema), transactionController.createInstallmentCard);
router.get('/', validateQuery(listTransactionsQuerySchema), transactionController.listByMonth);
router.patch('/:id/paid', transactionController.markAsPaid);
router.patch('/:id', validateBody(updateTransactionSchema), transactionController.update);
router.delete('/:id', transactionController.delete);

export const transactionRoutes = router;
