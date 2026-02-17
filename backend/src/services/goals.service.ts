import { transactionRepository } from '../repositories/transaction.repository.js';
import { categoryGoalRepository } from '../repositories/category-goal.repository.js';

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

export interface CategoryGoalItem {
  category: string;
  spent: number;
  limit: number | null;
}

export const goalsService = {
  /**
   * Lista categorias com gasto do mês e meta (se houver).
   * Categorias = todas que aparecem nas transações do mês + todas que têm meta cadastrada.
   */
  async getCategoriesWithSpendingAndGoals(
    userId: string,
    year: number,
    month: number
  ): Promise<CategoryGoalItem[]> {
    const start = new Date(year, month - 1, 1);
    const end = endOfMonth(new Date(year, month - 1, 1));

    const [spendingRows, goals] = await Promise.all([
      transactionRepository.sumByCategoryAndMonth(userId, start, end),
      categoryGoalRepository.findByUserId(userId),
    ]);

    const spentByCat: Record<string, number> = {};
    spendingRows.forEach((r) => {
      const name = r.category === 'Telegram' ? 'Despesa variável' : r.category;
      spentByCat[name] = (spentByCat[name] ?? 0) + r.total;
    });

    const limitByCat: Record<string, number> = {};
    goals.forEach((g) => {
      limitByCat[g.category] = Number(g.monthlyLimit);
    });

    const allCategories = new Set<string>([
      ...Object.keys(spentByCat),
      ...Object.keys(limitByCat),
    ]);

    const result: CategoryGoalItem[] = Array.from(allCategories)
      .filter((c) => c.trim() !== '')
      .map((category) => ({
        category,
        spent: spentByCat[category] ?? 0,
        limit: limitByCat[category] ?? null,
      }))
      .sort((a, b) => b.spent - a.spent);

    return result;
  },

  async setGoal(userId: string, category: string, monthlyLimit: number) {
    const cat = category.trim();
    if (!cat) throw new Error('Categoria é obrigatória');
    if (monthlyLimit < 0 || !Number.isFinite(monthlyLimit)) {
      throw new Error('Meta deve ser um valor não negativo');
    }
    return categoryGoalRepository.upsert(userId, cat, monthlyLimit);
  },

  async removeGoal(userId: string, category: string) {
    return categoryGoalRepository.delete(userId, category);
  },
};
