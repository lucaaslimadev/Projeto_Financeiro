import { prisma } from '../lib/prisma.js';
import type { Decimal } from '@prisma/client/runtime/library';

export const cardRepository = {
  create(userId: string, data: { name: string; limit: Decimal | number; closingDay: number; dueDay: number }) {
    return prisma.card.create({
      data: { userId, ...data },
    });
  },

  findManyByUserId(userId: string) {
    return prisma.card.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  },

  findByIdAndUserId(id: string, userId: string) {
    return prisma.card.findFirst({
      where: { id, userId },
    });
  },

  async update(id: string, userId: string, data: { name?: string; limit?: number; closingDay?: number; dueDay?: number }) {
    const card = await prisma.card.findFirst({ where: { id, userId } });
    if (!card) return null;
    return prisma.card.update({ where: { id }, data });
  },
};
