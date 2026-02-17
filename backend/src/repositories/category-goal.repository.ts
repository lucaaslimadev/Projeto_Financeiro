import { prisma } from '../lib/prisma.js';

export const categoryGoalRepository = {
  findByUserId(userId: string) {
    return prisma.categoryGoal.findMany({
      where: { userId },
      orderBy: { category: 'asc' },
    });
  },

  findByUserIdAndCategory(userId: string, category: string) {
    return prisma.categoryGoal.findUnique({
      where: { userId_category: { userId, category: category.trim() } },
    });
  },

  upsert(userId: string, category: string, monthlyLimit: number) {
    const cat = category.trim();
    if (!cat) throw new Error('Categoria é obrigatória');
    return prisma.categoryGoal.upsert({
      where: { userId_category: { userId, category: cat } },
      create: { userId, category: cat, monthlyLimit },
      update: { monthlyLimit },
    });
  },

  delete(userId: string, category: string) {
    return prisma.categoryGoal.deleteMany({
      where: { userId, category: category.trim() },
    });
  },
};
