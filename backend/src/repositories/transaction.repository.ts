import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';

export const transactionRepository = {
  create(data: Prisma.TransactionCreateInput) {
    return prisma.transaction.create({ data });
  },

  createMany(data: Prisma.TransactionCreateManyInput[]) {
    return prisma.transaction.createMany({ data });
  },

  findManyByUserAndMonth(userId: string, start: Date, end: Date) {
    return prisma.transaction.findMany({
      where: {
        userId,
        dueDate: { gte: start, lte: end },
      },
      include: { card: { select: { id: true, name: true } } },
      orderBy: { dueDate: 'asc' },
    });
  },

  findByIdAndUserId(id: string, userId: string) {
    return prisma.transaction.findFirst({
      where: { id, userId },
      include: { card: true },
    });
  },

  markAsPaid(id: string, userId: string) {
    return prisma.transaction.updateMany({
      where: { id, userId },
      data: { isPaid: true },
    });
  },

  delete(id: string, userId: string) {
    return prisma.transaction.deleteMany({
      where: { id, userId },
    });
  },

  async update(
    id: string,
    userId: string,
    data: { description?: string; amount?: number; dueDate?: Date; category?: string }
  ) {
    const payload: Prisma.TransactionUpdateInput = {};
    if (data.description != null) payload.description = data.description;
    if (data.amount != null) payload.amount = data.amount;
    if (data.dueDate != null) payload.dueDate = data.dueDate;
    if (data.category != null) payload.category = data.category;
    if (Object.keys(payload).length === 0) return null;
    const result = await prisma.transaction.updateMany({
      where: { id, userId },
      data: payload,
    });
    if (result.count === 0) return null;
    return prisma.transaction.findFirst({
      where: { id, userId },
      include: { card: { select: { id: true, name: true } } },
    });
  },

  findDueByUser(userId: string, from: Date, to: Date) {
    return prisma.transaction.findMany({
      where: { userId, isPaid: false, dueDate: { gte: from, lte: to } },
      include: { card: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });
  },

  /** Contas a vencer / atrasadas: só FIXED (programadas) e CARD (fatura), não VARIABLE */
  findBillsDueByUser(userId: string, from: Date, to: Date) {
    return prisma.transaction.findMany({
      where: {
        userId,
        isPaid: false,
        dueDate: { gte: from, lte: to },
        type: { in: ['FIXED', 'CARD'] },
      },
      include: { card: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });
  },

  findOverdueByUser(userId: string, before: Date) {
    return prisma.transaction.findMany({
      where: { userId, isPaid: false, dueDate: { lt: before } },
      include: { card: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });
  },

  /** Atrasadas: só FIXED e CARD, não VARIABLE */
  findBillsOverdueByUser(userId: string, before: Date) {
    return prisma.transaction.findMany({
      where: {
        userId,
        isPaid: false,
        dueDate: { lt: before },
        type: { in: ['FIXED', 'CARD'] },
      },
      include: { card: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });
  },

  /** Contas atrasadas só fixas (contas do mês). Parcelas no cartão (CARD) não entram aqui. */
  findFixedBillsOverdueByUser(userId: string, before: Date) {
    return prisma.transaction.findMany({
      where: {
        userId,
        isPaid: false,
        dueDate: { lt: before },
        type: 'FIXED',
      },
      include: { card: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    });
  },

  sumAmountByUserAndMonth(userId: string, start: Date, end: Date) {
    return prisma.transaction.aggregate({
      where: { userId, dueDate: { gte: start, lte: end } },
      _sum: { amount: true },
    });
  },

  sumUnpaidByCardAndPeriod(cardId: string, start: Date, end: Date) {
    return prisma.transaction.aggregate({
      where: { cardId, isPaid: false, dueDate: { gte: start, lte: end }, type: 'CARD' },
      _sum: { amount: true },
    });
  },

  /** Gastos do mês agrupados por categoria (apenas valores negativos = despesas). */
  async sumByCategoryAndMonth(userId: string, start: Date, end: Date) {
    const rows = await prisma.transaction.groupBy({
      by: ['category'],
      where: {
        userId,
        dueDate: { gte: start, lte: end },
        amount: { lt: 0 },
      },
      _sum: { amount: true },
    });
    return rows.map((r) => ({
      category: r.category,
      total: Math.abs(Number(r._sum.amount ?? 0)),
    }));
  },

  /** Transações que são modelo de recorrência (recurring = true e recurringDay preenchido) */
  findRecurringTemplates() {
    return prisma.transaction.findMany({
      where: { recurring: true, recurringDay: { not: null } },
      orderBy: [{ userId: 'asc' }, { createdAt: 'desc' }],
    });
  },

  /** Verifica se já existe transação recorrente no mês (mesmo user, descrição, categoria, valor, recurringDay) */
  async existsRecurringInMonth(
    userId: string,
    description: string,
    category: string,
    amount: number,
    recurringDay: number,
    monthStart: Date,
    monthEnd: Date
  ): Promise<boolean> {
    const count = await prisma.transaction.count({
      where: {
        userId,
        description,
        category,
        amount,
        recurring: true,
        recurringDay,
        dueDate: { gte: monthStart, lte: monthEnd },
      },
    });
    return count > 0;
  },
};
