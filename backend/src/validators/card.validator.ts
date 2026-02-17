import { z } from 'zod';

const daySchema = z.number().int().min(1).max(31);

export const createCardSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  limit: z.number().positive('Limite deve ser positivo'),
  closingDay: daySchema,
  dueDay: daySchema,
});

export const updateCardSchema = z.object({
  name: z.string().min(1).optional(),
  limit: z.number().positive().optional(),
  closingDay: daySchema.optional(),
  dueDay: daySchema.optional(),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
