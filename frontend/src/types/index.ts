export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Card {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'FIXED' | 'VARIABLE' | 'CARD' | 'INCOME' | 'ADJUSTMENT';

export type PaymentMethod = 'DEBIT' | 'PIX' | 'CASH' | 'CREDIT';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  dueDate: string;
  isPaid: boolean;
  recurring: boolean;
  recurringDay: number | null;
  installmentTotal: number | null;
  installmentNumber: number | null;
  cardId: string | null;
  card?: Card | null;
  paymentMethod?: PaymentMethod | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthTotal {
  total: number;
  year: number;
  month: number;
}

export interface InvoiceByCard {
  cardId: string;
  cardName: string;
  closingDay: number;
  dueDay: number;
  totalUnpaid: number;
  period: { year: number; month: number };
}

export interface AlertItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  card?: string;
}

export interface InvoiceClosedAlert {
  cardName: string;
  totalUnpaid: number;
  dueDay: number;
  closingDay: number;
}

export interface AlertsData {
  dueToday: AlertItem[];
  overdue: AlertItem[];
  invoiceClosed: InvoiceClosedAlert[];
}

export interface SpendingByCategoryItem {
  category: string;
  total: number;
}

export interface CategoryGoalItem {
  category: string;
  spent: number;
  limit: number | null;
}
