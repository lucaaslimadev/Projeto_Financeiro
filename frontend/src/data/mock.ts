/**
 * Dados mockados para o dashboard financeiro.
 * Pronto para substituição por chamadas à API.
 */

export type TransactionType = 'FIXED' | 'VARIABLE' | 'CARD';
export type TransactionStatus = 'PAID' | 'PENDING';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  installmentNumber?: number;
  installmentTotal?: number;
}

export interface AlertDueToday {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
}

export interface AlertOverdue {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
}

export interface AlertInvoiceClosed {
  cardName: string;
  cardId: string;
  totalUnpaid: number;
  closingDay: number;
  dueDay: number;
}

export interface DailyExpense {
  day: number;
  value: number;
  label: string;
}

export interface CategoryExpense {
  name: string;
  value: number;
  color: string;
}

export interface DashboardMock {
  balanceTotal: number;
  monthTotalSpent: number;
  billsDueCount: number;
  billsDueTotal: number;
  currentInvoiceTotal: number;
  alerts: {
    dueToday: AlertDueToday[];
    overdue: AlertOverdue[];
    invoiceClosed: AlertInvoiceClosed[];
  };
  dailyExpenses: DailyExpense[];
  categoryExpenses: CategoryExpense[];
  recentTransactions: Transaction[];
}

const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();
const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

export const dashboardMock: DashboardMock = {
  balanceTotal: 12450.8,
  monthTotalSpent: 5820.5,
  billsDueCount: 4,
  billsDueTotal: 1890,
  currentInvoiceTotal: 2340.0,
  alerts: {
    dueToday: [
      { id: '1', description: 'Aluguel', amount: 1200, dueDate: now.toISOString().slice(0, 10) },
      { id: '2', description: 'Internet', amount: 99.9, dueDate: now.toISOString().slice(0, 10) },
    ],
    overdue: [
      { id: '3', description: 'Conta de luz', amount: 185.5, dueDate: new Date(currentYear, currentMonth - 2, 5).toISOString().slice(0, 10) },
    ],
    invoiceClosed: [
      { cardName: 'Cartão Nubank', cardId: 'n1', totalUnpaid: 2340, closingDay: 10, dueDay: 17 },
    ],
  },
  dailyExpenses: Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    value: Math.round(80 + Math.random() * 220),
    label: `Dia ${i + 1}`,
  })),
  categoryExpenses: [
    { name: 'Alimentação', value: 1420, color: 'hsl(var(--chart-1))' },
    { name: 'Transporte', value: 680, color: 'hsl(var(--chart-2))' },
    { name: 'Moradia', value: 1200, color: 'hsl(var(--chart-3))' },
    { name: 'Lazer', value: 520, color: 'hsl(var(--chart-4))' },
    { name: 'Outros', value: 2000.5, color: 'hsl(var(--chart-5))' },
  ],
  recentTransactions: [
    { id: 't1', date: new Date().toISOString().slice(0, 10), description: 'Supermercado', category: 'Alimentação', amount: -245.9, type: 'VARIABLE', status: 'PAID' },
    { id: 't2', date: new Date(Date.now() - 864e5).toISOString().slice(0, 10), description: 'Aluguel', category: 'Moradia', amount: -1200, type: 'FIXED', status: 'PENDING' },
    { id: 't3', date: new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10), description: 'Posto Shell', category: 'Transporte', amount: -180, type: 'VARIABLE', status: 'PAID' },
    { id: 't4', date: new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10), description: 'Netflix', category: 'Lazer', amount: -55.9, type: 'CARD', status: 'PAID', installmentNumber: 1, installmentTotal: 1 },
    { id: 't5', date: new Date(Date.now() - 4 * 864e5).toISOString().slice(0, 10), description: 'Curso Udemy', category: 'Outros', amount: -89.9, type: 'CARD', status: 'PENDING', installmentNumber: 2, installmentTotal: 3 },
  ],
};

export function getDashboardMock(): DashboardMock {
  return dashboardMock;
}
