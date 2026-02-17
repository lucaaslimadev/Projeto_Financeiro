import { z } from 'zod';

const transactionTypeSchema = z.enum(['FIXED', 'VARIABLE', 'CARD', 'INCOME', 'ADJUSTMENT']);

export const createTransactionSimpleSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória'),
  amount: z.number(),
  type: transactionTypeSchema,
  category: z.string().min(1, 'Categoria obrigatória'),
  dueDate: z.string().min(1, 'Data obrigatória'),
  cardId: z.string().uuid().optional().nullable(),
});

export const createIncomeSchema = z.object({
  description: z.string().min(1, 'Descrição obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  category: z.string().min(1, 'Categoria obrigatória'),
  dueDate: z.string().min(1, 'Data obrigatória'),
});

export const createRecurringFixedSchema = z.object({
  description: z.string().min(1),
  amount: z.number(),
  category: z.string().min(1),
  recurringDay: z.number().int().min(1).max(31),
});

const paymentMethodSchema = z.enum(['DEBIT', 'PIX', 'CASH', 'CREDIT']).optional().nullable();

export const createVariableExpenseSchema = z.object({
  description: z.string().min(1),
  amount: z.number().negative('Despesa deve ser negativa'),
  category: z.string().min(1),
  dueDate: z.string(),
  paymentMethod: paymentMethodSchema,
});

export const createInstallmentCardSchema = z.object({
  description: z.string().min(1),
  totalAmount: z.number().positive(),
  installments: z.number().int().min(2).max(60),
  dueDay: z.number().int().min(1).max(31),
  cardId: z.string().uuid(),
  category: z.string().min(1),
});

export const listTransactionsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const updateTransactionSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().optional(),
  dueDate: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
});

export type CreateTransactionSimpleInput = z.infer<typeof createTransactionSimpleSchema>;
export type CreateIncomeInput = z.infer<typeof createIncomeSchema>;
export type CreateRecurringFixedInput = z.infer<typeof createRecurringFixedSchema>;
export type CreateVariableExpenseInput = z.infer<typeof createVariableExpenseSchema>;
export type CreateInstallmentCardInput = z.infer<typeof createInstallmentCardSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
