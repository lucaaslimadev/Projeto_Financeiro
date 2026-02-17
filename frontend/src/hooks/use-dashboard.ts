import useSWR from 'swr';
import api from '@/lib/api';
import type { Transaction, MonthTotal, InvoiceByCard, AlertsData, SpendingByCategoryItem } from '@/types';

function currentYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function useMonthTotal(year?: number, month?: number) {
  const { year: y, month: m } = year && month ? { year, month } : currentYearMonth();
  return useSWR<MonthTotal>(['dashboard', 'month-total', y, m], () =>
    api.get(`/dashboard/month-total?year=${y}&month=${m}`).then((r) => r.data)
  );
}

export function useBillsDue(year?: number, month?: number) {
  const { year: y, month: m } = year && month ? { year, month } : currentYearMonth();
  return useSWR<Transaction[]>(['dashboard', 'bills-due', y, m], () =>
    api.get(`/dashboard/bills-due?year=${y}&month=${m}`).then((r) => r.data)
  );
}

export function useOverdue() {
  return useSWR<Transaction[]>(['dashboard', 'overdue'], () =>
    api.get('/dashboard/overdue').then((r) => r.data)
  );
}

export function useInvoiceByCard(year?: number, month?: number) {
  const { year: y, month: m } = year && month ? { year, month } : currentYearMonth();
  return useSWR<InvoiceByCard[]>(['dashboard', 'invoice-by-card', y, m], () =>
    api.get(`/dashboard/invoice-by-card?year=${y}&month=${m}`).then((r) => r.data)
  );
}

export function useAlerts() {
  return useSWR<AlertsData>(['dashboard', 'alerts'], () =>
    api.get('/dashboard/alerts').then((r) => r.data)
  );
}

/** Maiores gastos do mês por categoria (relatórios). */
export function useSpendingByCategory(year?: number, month?: number) {
  const { year: y, month: m } = year && month ? { year, month } : currentYearMonth();
  return useSWR<SpendingByCategoryItem[]>(['dashboard', 'spending-by-category', y, m], () =>
    api.get(`/dashboard/spending-by-category?year=${y}&month=${m}`).then((r) => r.data)
  );
}

/** Saldo total (conta corrente). */
export function useDashboardBalance() {
  const { data, isLoading, mutate } = useSWR<{ balance: number }>(
    ['dashboard', 'balance'],
    () => api.get('/dashboard/balance').then((r) => r.data)
  );
  return {
    balanceTotal: data?.balance ?? 0,
    isLoading,
    mutateBalance: mutate,
  };
}

export interface YearReportMonth {
  month: number;
  monthLabel: string;
  year: number;
  receitas: number;
  despesas: number;
  saldo: number;
  variable: number;
  fixed: number;
  card: number;
}

export interface YearReport {
  monthlyBreakdown: YearReportMonth[];
  yearTotals: { receitas: number; despesas: number; saldo: number };
  previousYearTotals: { receitas: number; despesas: number; saldo: number };
  categoryTotalsYear: { category: string; total: number }[];
}

/** Relatório anual para a página Relatórios. */
export function useYearReport(year?: number) {
  const y = year ?? new Date().getFullYear();
  const { data, isLoading } = useSWR<YearReport>(
    ['dashboard', 'year-report', y],
    () => api.get(`/dashboard/year-report?year=${y}`).then((r) => r.data)
  );
  return { data, isLoading };
}
