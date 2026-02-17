import { transactionRepository } from '../repositories/transaction.repository.js';
import { cardRepository } from '../repositories/card.repository.js';
import { dashboardService } from './dashboard.service.js';
import { buildInstallmentItems, fromCents } from '../lib/installment.js';
import type {
  CreateTransactionSimpleInput,
  CreateIncomeInput,
  CreateRecurringFixedInput,
  CreateVariableExpenseInput,
  CreateInstallmentCardInput,
  ListTransactionsQuery,
  UpdateTransactionInput,
} from '../validators/transaction.validator.js';

/** Interpreta string de data. YYYY-MM-DD (apenas data) = início do dia no fuso do servidor, evitando que "hoje" vire "ontem" (UTC). */
function parseDate(s: string): Date {
  const trimmed = s.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const [, y, m, d] = dateOnlyMatch;
    const year = parseInt(y!, 10);
    const month = parseInt(m!, 10) - 1;
    const day = parseInt(d!, 10);
    const d2 = new Date(year, month, day);
    if (Number.isNaN(d2.getTime())) throw new Error('Data inválida');
    return d2;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) throw new Error('Data inválida');
  return d;
}

function lastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0);
}

function firstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

export const transactionService = {
  async createSimple(userId: string, input: CreateTransactionSimpleInput) {
    const dueDate = parseDate(input.dueDate);
    return transactionRepository.create({
      user: { connect: { id: userId } },
      ...(input.cardId && { card: { connect: { id: input.cardId } } }),
      description: input.description,
      amount: input.amount,
      type: input.type,
      category: input.category,
      dueDate,
      isPaid: false,
      recurring: false,
    });
  },

  async createRecurringFixed(userId: string, input: CreateRecurringFixedInput) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let year = now.getFullYear();
    let month = now.getMonth();
    const day = Math.min(input.recurringDay, lastDayOfMonth(year, month + 1).getDate());
    let dueDate = new Date(year, month, day);
    // Se o dia já passou neste mês, usa a primeira ocorrência no mês seguinte (evita entrar como atrasada)
    if (dueDate < startOfToday) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      const dayNext = Math.min(input.recurringDay, lastDayOfMonth(year, month + 1).getDate());
      dueDate = new Date(year, month, dayNext);
    }
    return transactionRepository.create({
      user: { connect: { id: userId } },
      description: input.description,
      amount: -Math.abs(input.amount),
      type: 'FIXED',
      category: input.category,
      dueDate,
      isPaid: false,
      recurring: true,
      recurringDay: input.recurringDay,
    });
  },

  async createIncome(userId: string, input: CreateIncomeInput) {
    const dueDate = parseDate(input.dueDate);
    return transactionRepository.create({
      user: { connect: { id: userId } },
      description: input.description,
      amount: Math.abs(input.amount),
      type: 'INCOME',
      category: input.category,
      dueDate,
      isPaid: true,
    });
  },

  async createVariableExpense(userId: string, input: CreateVariableExpenseInput) {
    const dueDate = parseDate(input.dueDate);
    return transactionRepository.create({
      user: { connect: { id: userId } },
      description: input.description,
      amount: input.amount,
      type: 'VARIABLE',
      category: input.category,
      dueDate,
      isPaid: false,
      ...(input.paymentMethod && { paymentMethod: input.paymentMethod }),
    });
  },

  async createInstallmentCard(userId: string, input: CreateInstallmentCardInput) {
    const card = await cardRepository.findByIdAndUserId(input.cardId, userId);
    if (!card) throw new Error('Cartão não encontrado');
    const startDate = new Date();
    const items = buildInstallmentItems({
      totalAmount: input.totalAmount,
      installments: input.installments,
      dueDay: card.dueDay,
      startDate,
      closingDay: card.closingDay,
    });

    const transactions = items.map((item) => ({
      userId,
      cardId: input.cardId,
      description: `${input.description} (${item.installmentNumber}/${item.installmentTotal})`,
      amount: fromCents(item.amountCents),
      type: 'CARD' as const,
      category: input.category,
      dueDate: item.dueDate,
      isPaid: false,
      installmentTotal: item.installmentTotal,
      installmentNumber: item.installmentNumber,
    }));

    await transactionRepository.createMany(transactions);
    return { count: input.installments, message: 'Parcelas criadas com sucesso' };
  },

  async listByMonth(userId: string, query: ListTransactionsQuery) {
    const start = firstDayOfMonth(query.year, query.month);
    const end = lastDayOfMonth(query.year, query.month);
    return transactionRepository.findManyByUserAndMonth(userId, start, end);
  },

  async markAsPaid(userId: string, transactionId: string) {
    const tx = await transactionRepository.findByIdAndUserId(transactionId, userId);
    if (!tx) return null;
    await transactionRepository.markAsPaid(transactionId, userId);
    return transactionRepository.findByIdAndUserId(transactionId, userId);
  },

  async delete(userId: string, transactionId: string) {
    const tx = await transactionRepository.findByIdAndUserId(transactionId, userId);
    if (!tx) return null;
    const amount = Number(tx.amount);
    if (tx.type === 'ADJUSTMENT') {
      await dashboardService.revertBalanceFromAdjustment(userId, amount);
    }
    await transactionRepository.delete(transactionId, userId);
    return { deleted: true };
  },

  async update(userId: string, transactionId: string, input: UpdateTransactionInput) {
    const tx = await transactionRepository.findByIdAndUserId(transactionId, userId);
    if (!tx) return null;
    const data: { description?: string; amount?: number; dueDate?: Date; category?: string } = {};
    if (input.description != null) data.description = input.description;
    if (input.amount != null) data.amount = input.amount;
    if (input.dueDate != null) data.dueDate = parseDate(input.dueDate);
    if (input.category != null) data.category = input.category;
    return transactionRepository.update(transactionId, userId, data);
  },
};
