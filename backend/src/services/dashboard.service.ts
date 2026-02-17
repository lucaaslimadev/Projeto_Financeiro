import { prisma } from '../lib/prisma.js';
import { transactionRepository } from '../repositories/transaction.repository.js';

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}

export const dashboardService = {
  async getBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true },
    });
    return { balance: Number(user?.balance ?? 0) };
  },

  async updateBalance(userId: string, balance: number, paymentMethod?: 'DEBIT' | 'PIX' | 'CASH' | null) {
    const current = await this.getBalance(userId);
    const oldBalance = current.balance;
    const diff = balance - oldBalance;
    if (diff !== 0) {
      await transactionRepository.create({
        user: { connect: { id: userId } },
        description: 'Ajuste de saldo (conciliação)',
        amount: diff,
        type: 'ADJUSTMENT',
        category: 'Ajuste',
        dueDate: new Date(),
        isPaid: true,
        ...(paymentMethod && { paymentMethod }),
      });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { balance },
    });
    return { balance };
  },

  /** Reverte o saldo ao excluir uma transação de ajuste (conciliação). */
  async revertBalanceFromAdjustment(userId: string, adjustmentAmount: number) {
    const current = await this.getBalance(userId);
    const newBalance = current.balance - adjustmentAmount;
    await prisma.user.update({
      where: { id: userId },
      data: { balance: newBalance },
    });
    return { balance: newBalance };
  },

  /** Contas a vencer: só FIXED (programadas) e CARD (fatura), não despesas variáveis */
  async getBillsDue(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = endOfMonth(new Date(year, month - 1, 1));
    const today = new Date();
    const from = today > start ? today : start;
    return transactionRepository.findBillsDueByUser(userId, from, end);
  },

  /** Atrasadas: só FIXED e CARD */
  async getOverdue(userId: string) {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return transactionRepository.findBillsOverdueByUser(userId, startOfToday);
  },

  async getMonthTotal(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = endOfMonth(new Date(year, month - 1, 1));
    const result = await transactionRepository.sumAmountByUserAndMonth(userId, start, end);
    return { total: Number(result._sum.amount ?? 0), year, month };
  },

  /** Maiores gastos do mês por categoria (para relatórios). Apenas despesas (valor absoluto). */
  async getSpendingByCategory(userId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1);
    const end = endOfMonth(new Date(year, month - 1, 1));
    const rows = await transactionRepository.sumByCategoryAndMonth(userId, start, end);
    return rows
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .map((r) => ({ category: r.category, total: r.total }));
  },

  async getCurrentInvoiceByCard(userId: string, year?: number, month?: number) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const m = month ?? now.getMonth() + 1;
    const cards = await prisma.card.findMany({ where: { userId } });
    const start = new Date(y, m - 1, 1);
    const end = endOfMonth(new Date(y, m - 1, 1));
    const invoices = await Promise.all(
      cards.map(async (card) => {
        const sum = await transactionRepository.sumUnpaidByCardAndPeriod(card.id, start, end);
        return {
          cardId: card.id,
          cardName: card.name,
          closingDay: card.closingDay,
          dueDay: card.dueDay,
          totalUnpaid: Number(sum._sum.amount ?? 0),
          period: { year: y, month: m },
        };
      })
    );
    return invoices;
  },

  /**
   * Relatório anual: breakdown mensal (receitas, despesas, saldo, por tipo), totais do ano,
   * categorias no ano, e totais do ano anterior para comparação.
   */
  async getYearReport(userId: string, year: number) {
    const start = new Date(year, 0, 1);
    const end = endOfMonth(new Date(year, 11, 1));
    const startPrev = new Date(year - 1, 0, 1);
    const endPrev = endOfMonth(new Date(year - 1, 11, 1));

    const [txs, txsPrev] = await Promise.all([
      transactionRepository.findManyByUserAndMonth(userId, start, end),
      transactionRepository.findManyByUserAndMonth(userId, startPrev, endPrev),
    ]);

    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    function aggregateByMonth(transactions: { dueDate: Date; amount: unknown; type: string }[]) {
      const byMonth: Record<
        number,
        { receitas: number; despesas: number; variable: number; fixed: number; card: number }
      > = {};
      for (let m = 1; m <= 12; m++) {
        byMonth[m] = { receitas: 0, despesas: 0, variable: 0, fixed: 0, card: 0 };
      }
      transactions.forEach((t) => {
        const amt = Number(t.amount);
        const month = new Date(t.dueDate).getMonth() + 1;
        if (amt > 0) {
          byMonth[month].receitas += amt;
        } else if (amt < 0 && t.type !== 'ADJUSTMENT') {
          const abs = Math.abs(amt);
          byMonth[month].despesas += abs;
          if (t.type === 'VARIABLE') byMonth[month].variable += abs;
          else if (t.type === 'FIXED') byMonth[month].fixed += abs;
          else if (t.type === 'CARD') byMonth[month].card += abs;
        }
      });
      return byMonth;
    }

    function aggregateCategories(transactions: { amount: unknown; category: string; type: string }[]) {
      const byCat: Record<string, number> = {};
      transactions.forEach((t) => {
        const amt = Number(t.amount);
        if (amt >= 0) return;
        if (t.type === 'ADJUSTMENT') return;
        const cat = t.category === 'Telegram' ? 'Despesa variável' : t.category;
        byCat[cat] = (byCat[cat] ?? 0) + Math.abs(amt);
      });
      return Object.entries(byCat)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);
    }

    const byMonth = aggregateByMonth(txs);
    const byMonthPrev = aggregateByMonth(txsPrev);

    const monthlyBreakdown = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => {
      const m = byMonth[month];
      const receitas = m.receitas;
      const despesas = m.despesas;
      const saldo = receitas - despesas;
      return {
        month,
        monthLabel: monthNames[month - 1],
        year,
        receitas,
        despesas,
        saldo,
        variable: m.variable,
        fixed: m.fixed,
        card: m.card,
      };
    });

    const yearTotals = monthlyBreakdown.reduce(
      (acc, m) => ({
        receitas: acc.receitas + m.receitas,
        despesas: acc.despesas + m.despesas,
        saldo: acc.saldo + m.saldo,
      }),
      { receitas: 0, despesas: 0, saldo: 0 }
    );

    const prevYearTotals = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce(
      (acc, month) => {
        const m = byMonthPrev[month];
        const rec = m.receitas;
        const des = m.despesas;
        return {
          receitas: acc.receitas + rec,
          despesas: acc.despesas + des,
          saldo: acc.saldo + (rec - des),
        };
      },
      { receitas: 0, despesas: 0, saldo: 0 }
    );

    const categoryTotalsYear = aggregateCategories(txs);

    return {
      monthlyBreakdown,
      yearTotals,
      previousYearTotals: prevYearTotals,
      categoryTotalsYear,
    };
  },

  /** Alertas: vencendo hoje, atrasadas, faturas fechadas */
  async getAlerts(userId: string) {
    const now = new Date();
    const today = now.getDate();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [dueToday, overdue, invoices] = await Promise.all([
      transactionRepository.findBillsDueByUser(userId, startOfToday, endOfToday),
      transactionRepository.findFixedBillsOverdueByUser(userId, startOfToday),
      this.getCurrentInvoiceByCard(userId),
    ]);

    const invoiceClosed = invoices.filter(
      (inv) => today >= inv.closingDay && inv.totalUnpaid !== 0
    ).map((inv) => ({
      cardName: inv.cardName,
      totalUnpaid: inv.totalUnpaid,
      dueDay: inv.dueDay,
      closingDay: inv.closingDay,
    }));

    return {
      dueToday: dueToday.map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        dueDate: t.dueDate.toISOString(),
        card: t.card?.name,
      })),
      overdue: overdue.map((t) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        dueDate: t.dueDate.toISOString(),
        card: t.card?.name,
      })),
      invoiceClosed,
    };
  },
};
