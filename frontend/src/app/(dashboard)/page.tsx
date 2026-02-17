'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  CalendarClock,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
  useMonthTotal,
  useBillsDue,
  useInvoiceByCard,
  useAlerts,
  useDashboardBalance,
} from '@/hooks/use-dashboard';
import { useTransactions, useMarkAsPaid } from '@/hooks/use-transactions';
import { useCategoryGoals } from '@/hooks/use-goals';
import type { TransactionType } from '@/types';
import type { Transaction } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
}

function typeLabel(type: TransactionType): string {
  switch (type) {
    case 'FIXED':
      return 'Fixa';
    case 'VARIABLE':
      return 'Variável';
    case 'CARD':
      return 'Cartão';
    case 'INCOME':
      return 'Receita';
    case 'ADJUSTMENT':
      return 'Ajuste';
    default:
      return type;
  }
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { balanceTotal, mutateBalance, isLoading: balanceLoading } = useDashboardBalance();
  const { data: categoryGoals } = useCategoryGoals(year, month);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');
  const [balancePaymentMethod, setBalancePaymentMethod] = useState<string>('');
  const [balanceSaving, setBalanceSaving] = useState(false);
  const [balanceError, setBalanceError] = useState('');
  const { data: monthTotal } = useMonthTotal(year, month);
  const { data: billsDue, isLoading: billsDueLoading } = useBillsDue(year, month);
  const { data: invoices, isLoading: invoicesLoading } = useInvoiceByCard(year, month);
  const { data: alerts } = useAlerts();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(year, month);
  const markPaid = useMarkAsPaid();

  /** Skeleton para valor + linha de descrição nos cards */
  const CardValueSkeleton = () => (
    <>
      <div className="h-8 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-1 h-3 w-20 animate-pulse rounded bg-muted" />
    </>
  );

  const receitasMes = useMemo(
    () => (transactions ?? []).reduce((s, t) => s + (Number(t.amount) > 0 ? Number(t.amount) : 0), 0),
    [transactions]
  );
  const despesasMes = useMemo(
    () => (transactions ?? []).reduce((s, t) => s + (Number(t.amount) < 0 ? Math.abs(Number(t.amount)) : 0), 0),
    [transactions]
  );
  const totalGastoMes = despesasMes;
  const billsDueCount = billsDue?.length ?? 0;
  const billsDueTotal = billsDue?.reduce((s, t) => s + Math.abs(Number(t.amount)), 0) ?? 0;
  const currentInvoiceTotal = invoices?.reduce((s, inv) => s + inv.totalUnpaid, 0) ?? 0;

  const hasAlerts =
    (alerts?.dueToday?.length ?? 0) > 0 ||
    (alerts?.overdue?.length ?? 0) > 0 ||
    (alerts?.invoiceClosed?.length ?? 0) > 0;

  const recentTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions]
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .slice(0, 10);
  }, [transactions]);

  const dailyExpenses = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const byDay: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) byDay[d] = 0;
    transactions?.forEach((t) => {
      const d = new Date(t.dueDate).getDate();
      if (d >= 1 && d <= daysInMonth) byDay[d] += Math.abs(Number(t.amount));
    });
    return Object.entries(byDay).map(([day, value]) => ({
      day: Number(day),
      value,
      label: `Dia ${day}`,
    }));
  }, [transactions, year, month]);

  /** Gráfico do dashboard: só por tipo (Despesa variável, Conta fixa, Cartão). Sem detalhe por categoria. */
  const expensesByType = useMemo(() => {
    const byType: Record<string, number> = {};
    transactions?.forEach((t) => {
      const amt = Number(t.amount);
      if (amt >= 0 || t.type === 'ADJUSTMENT') return;
      const label = t.type === 'VARIABLE' ? 'Despesa variável' : t.type === 'FIXED' ? 'Conta fixa' : t.type === 'CARD' ? 'Cartão' : 'Outros';
      byType[label] = (byType[label] ?? 0) + Math.abs(amt);
    });
    const order = ['Despesa variável', 'Conta fixa', 'Cartão', 'Outros'];
    const entries = order.filter((label) => (byType[label] ?? 0) > 0).map((label, i) => ({
      name: label,
      value: byType[label] ?? 0,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
    return entries.length ? entries : [{ name: 'Nenhum gasto', value: 0, color: CHART_COLORS[0] }];
  }, [transactions]);

  /** Metas por categoria: agrupa por categoria (gasolina, farmácia, etc.), exclui ajustes. */
  const categoryExpenses = useMemo(() => {
    const byCat: Record<string, number> = {};
    transactions?.forEach((t) => {
      const amt = Number(t.amount);
      if (amt >= 0 || t.type === 'ADJUSTMENT') return;
      const cat = t.category || 'Outros';
      const name = cat === 'Telegram' ? 'Despesa variável' : cat;
      byCat[name] = (byCat[name] ?? 0) + Math.abs(amt);
    });
    const entries = Object.entries(byCat).map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));
    return entries.length ? entries : [{ name: 'Nenhum gasto', value: 0, color: CHART_COLORS[0] }];
  }, [transactions]);

  function handleExportCsv() {
    if (!transactions?.length) return;
    const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo'];
    const rows = [...transactions]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .map((t) => [
        new Date(t.dueDate).toLocaleDateString('pt-BR'),
        t.description,
        t.category,
        String(t.amount),
        typeLabel(t.type),
      ]);
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${year}_${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleExportPdf() {
    const doc = new jsPDF();
    const title = `Resumo financeiro - ${MONTHS[month - 1]}/${year}`;
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(11);
    let y = 32;
    doc.text(`Saldo total: ${formatMoney(balanceTotal)}`, 14, y); y += 8;
    doc.text(`Receitas do mês: ${formatMoney(receitasMes)}`, 14, y); y += 8;
    doc.text(`Despesas do mês: ${formatMoney(totalGastoMes)}`, 14, y); y += 8;
    doc.text(`Contas a vencer: ${billsDueCount} (${formatMoney(billsDueTotal)})`, 14, y); y += 8;
    doc.text(`Fatura cartão: ${formatMoney(currentInvoiceTotal)}`, 14, y); y += 14;
    doc.setFontSize(12);
    doc.text('Top categorias (despesas)', 14, y); y += 8;
    doc.setFontSize(10);
    const topCategories = categoryExpenses
      .filter((d) => d.name !== 'Nenhum gasto' && d.value > 0)
      .sort((a, b) => (b.value as number) - (a.value as number))
      .slice(0, 8);
    topCategories.forEach((c) => {
      doc.text(`${c.name}: ${formatMoney(Number(c.value))}`, 18, y);
      y += 6;
    });
    doc.save(`resumo_${year}_${String(month).padStart(2, '0')}.pdf`);
    toast.success('PDF exportado');
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  const { todayTs, in7DaysTs } = useMemo(() => {
    const d = new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    start.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return { todayTs: start.getTime(), in7DaysTs: end.getTime() };
  }, []);
  const billsDueNext7Days = useMemo(() => {
    if (!billsDue || !isCurrentMonth) return [];
    return billsDue.filter((t) => {
      const tDate = new Date(t.dueDate).getTime();
      return tDate >= todayTs && tDate <= in7DaysTs;
    });
  }, [billsDue, isCurrentMonth, todayTs, in7DaysTs]);

  const exceededCategories = useMemo(() => {
    return (categoryGoals ?? []).filter(
      (g) => (g.limit ?? 0) > 0 && g.spent > (g.limit ?? 0)
    );
  }, [categoryGoals]);

  useEffect(() => {
    if (!transactions?.length || exceededCategories.length === 0) return;
    const msg =
      exceededCategories.length === 1
        ? `Meta ultrapassada: ${exceededCategories[0].category} (${formatMoney(exceededCategories[0].spent)} / ${formatMoney(exceededCategories[0].limit!)})`
        : `${exceededCategories.length} categorias acima da meta: ${exceededCategories.map((c) => c.category).join(', ')}`;
    toast.warning(msg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exceededCategories.length, transactions?.length]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas finanças</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {[year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!transactions?.length}>
            Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPdf}>
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* 1) Cards de resumo */}
      <section className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className={balanceTotal >= 0 ? 'border-l-4 border-l-emerald-500/50' : 'border-l-4 border-l-destructive/50'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <CardValueSkeleton />
            ) : (
              <>
                <p
                  className={`text-2xl font-bold tabular-nums ${
                    balanceTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                  }`}
                >
                  {formatMoney(balanceTotal)}
                </p>
                <p className="text-xs text-muted-foreground">Disponível agora</p>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setBalanceInput(String(balanceTotal));
                setBalanceError('');
                setBalanceModalOpen(true);
              }}
            >
              Ajustar saldo
            </Button>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <CardValueSkeleton />
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatMoney(receitasMes)}
                </p>
                <p className="text-xs text-muted-foreground">Entradas no período</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <CardValueSkeleton />
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums text-destructive">
                  {formatMoney(totalGastoMes)}
                </p>
                <p className="text-xs text-muted-foreground">Saídas no período</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a vencer</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {billsDueLoading ? (
              <CardValueSkeleton />
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums text-foreground">{billsDueCount}</p>
                <p className="text-xs text-muted-foreground">Total {formatMoney(billsDueTotal)}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fatura atual do cartão</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <CardValueSkeleton />
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums text-destructive">
                  {formatMoney(currentInvoiceTotal)}
                </p>
                <p className="text-xs text-muted-foreground">Fechamento próximo</p>
              </>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Vence nos próximos 7 dias (só no mês atual) */}
      {isCurrentMonth && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Vence nos próximos 7 dias</h2>
          {!billsDue ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Carregando…
            </div>
          ) : billsDueNext7Days.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-6 text-center">
              <CalendarClock className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Nada vence nos próximos 7 dias</p>
              <p className="text-xs text-muted-foreground">Contas e faturas com vencimento na próxima semana aparecem aqui.</p>
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {billsDueNext7Days.map((t) => (
                    <BillDueRow
                      key={t.id}
                      transaction={t}
                      onMarkPaid={async () => {
                        await markPaid.mutateAsync(t.id);
                        toast.success('Conta marcada como paga');
                      }}
                      markingPaid={markPaid.isPending}
                      formatMoney={formatMoney}
                      formatDate={formatDate}
                    />
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Contas a vencer: lista com botão Pagar */}
      <section id="contas-a-vencer">
        <h2 className="mb-3 text-lg font-semibold text-foreground">Contas a vencer</h2>
        {!billsDue ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Carregando…
          </div>
        ) : billsDue.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <CalendarClock className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Nenhuma conta a vencer no período</p>
            <p className="text-xs text-muted-foreground">Quando houver contas fixas ou faturas no mês, elas aparecerão aqui.</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {billsDue.map((t) => (
                  <BillDueRow
                    key={t.id}
                    transaction={t}
                    onMarkPaid={async () => {
                      await markPaid.mutateAsync(t.id);
                      toast.success('Conta marcada como paga');
                    }}
                    markingPaid={markPaid.isPending}
                    formatMoney={formatMoney}
                    formatDate={formatDate}
                  />
                ))}
              </ul>
              <div className="p-3 border-t">
                <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
                  Ver todas as transações
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* 2) Alertas */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground">Alertas importantes</h2>
        {!alerts ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            Carregando alertas…
          </div>
        ) : !hasAlerts ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-8 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">Nenhum alerta no momento</p>
            <p className="text-xs text-muted-foreground">Contas vencendo hoje, atrasadas ou faturas fechadas aparecem aqui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(alerts.dueToday?.length ?? 0) > 0 && (
              <Alert className="border-amber-500/50 bg-amber-500/10 dark:bg-amber-500/5">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle>Contas vencendo hoje</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 list-inside space-y-0.5 text-sm">
                    {alerts.dueToday.map((a) => (
                      <li key={a.id}>
                        {a.description} — {formatMoney(a.amount)}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            {(alerts.overdue?.length ?? 0) > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Contas atrasadas</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 list-inside space-y-0.5 text-sm">
                    {alerts.overdue.map((a) => (
                      <li key={a.id}>
                        {a.description} — {formatMoney(a.amount)}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/transactions"
                    className="mt-2 inline-block text-sm font-medium underline underline-offset-2"
                  >
                    Ver transações
                  </Link>
                </AlertDescription>
              </Alert>
            )}
            {(alerts.invoiceClosed?.length ?? 0) > 0 && (
              <Alert className="border-blue-500/50 bg-blue-500/10 dark:bg-blue-500/5">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle>Fatura fechada do cartão</AlertTitle>
                <AlertDescription>
                  <ul className="mt-1 space-y-1 text-sm">
                    {alerts.invoiceClosed.map((inv, i) => (
                      <li key={`${inv.cardName}-${i}`}>
                        <strong>{inv.cardName}</strong>: {formatMoney(inv.totalUnpaid)} — vence dia{' '}
                        {inv.dueDay}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </section>

      {/* 3) Gráfico gastos por dia + 4) Gráfico por categoria */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gastos por dia do mês</CardTitle>
            <CardDescription>Valor gasto por dia no mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dailyExpenses}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v) => `R$ ${v}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      [value != null ? formatMoney(value) : '—', 'Gasto']
                    }
                    labelFormatter={(label) => `Dia ${label}`}
                    contentStyle={{
                      borderRadius: 'var(--radius)',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                    name="Gasto"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Gastos por tipo</CardTitle>
            <CardDescription>Despesa variável, contas fixas e cartão no mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByType}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }) =>
                      `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {expensesByType.map((_, index) => (
                      <Cell key={index} fill={expensesByType[index].color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value != null ? formatMoney(value) : '—'
                    }
                    contentStyle={{
                      borderRadius: 'var(--radius)',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metas por categoria (apenas demonstrativo; editar em Metas) */}
      <Card>
        <CardHeader>
          <CardTitle>Metas por categoria</CardTitle>
          <CardDescription>
            Resumo do mês: dentro ou acima da meta. Para criar categorias e definir metas, use a página Metas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!categoryGoals?.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma categoria com gasto ou meta neste mês. Crie categorias e defina metas em <Link href="/goals" className="font-medium text-primary hover:underline">Metas</Link>.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {(categoryGoals ?? [])
                  .filter((g) => g.spent > 0 || (g.limit != null && g.limit > 0))
                  .map((g) => {
                    const limit = g.limit ?? 0;
                    const hasLimit = limit > 0;
                    const exceeded = hasLimit && g.spent > limit;
                    return (
                      <div
                        key={g.category}
                        className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                      >
                        <span className="font-medium min-w-[120px]">{g.category}</span>
                        <span className="tabular-nums text-muted-foreground">
                          Gasto: {formatMoney(g.spent)}
                        </span>
                        {hasLimit && (
                          <>
                            <span className="text-xs text-muted-foreground">
                              Meta: {formatMoney(limit)}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-medium ${
                                exceeded
                                  ? 'bg-destructive/15 text-destructive'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              }`}
                            >
                              {exceeded ? 'Ultrapassou' : 'Dentro da meta'}
                            </span>
                          </>
                        )}
                        {!hasLimit && g.spent > 0 && (
                          <span className="text-xs text-muted-foreground">Sem meta</span>
                        )}
                      </div>
                    );
                  })}
              </div>
              <div className="mt-4">
                <Link
                  href="/goals"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Gerenciar metas →
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 5) Transações recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Transações recentes</CardTitle>
          <CardDescription>Últimas movimentações</CardDescription>
        </CardHeader>
        <CardContent>
          {!transactions ? (
            <p className="text-sm text-muted-foreground">Carregando transações…</p>
          ) : recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma transação no mês.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium text-muted-foreground">
                        {formatDate(t.dueDate)}
                      </TableCell>
                      <TableCell>{t.description}</TableCell>
                      <TableCell>{t.category === 'Telegram' ? 'Despesa variável' : t.category}</TableCell>
                      <TableCell
                        className={`text-right tabular-nums ${
                          Number(t.amount) < 0
                            ? 'text-destructive'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {formatMoney(Number(t.amount))}
                      </TableCell>
                      <TableCell>{typeLabel(t.type)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4">
                <Link
                  href="/transactions"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Ver todas as transações
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Ajustar saldo */}
      <Modal
        open={balanceModalOpen}
        onClose={() => setBalanceModalOpen(false)}
        title="Ajustar saldo"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBalanceError('');
            setBalanceSaving(true);
            try {
              const value = Number(balanceInput.replace(',', '.'));
              if (!Number.isFinite(value)) {
                setBalanceError('Informe um valor numérico.');
                return;
              }
              const paymentMethod =
                balancePaymentMethod && ['DEBIT', 'PIX', 'CASH'].includes(balancePaymentMethod)
                  ? balancePaymentMethod
                  : undefined;
              await api.patch('/dashboard/balance', { balance: value, paymentMethod });
              await mutateBalance();
              setBalanceModalOpen(false);
              setBalancePaymentMethod('');
            } catch (err: unknown) {
              const res =
                err && typeof err === 'object' && 'response' in err
                  ? (err as { response?: { data?: { error?: string } } }).response?.data
                  : null;
              setBalanceError(res?.error || 'Erro ao salvar.');
            } finally {
              setBalanceSaving(false);
            }
          }}
          className="space-y-4"
        >
          <Input
            label="Saldo atual (R$)"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={balanceInput}
            onChange={(e) => setBalanceInput(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Como entrou esse valor?</label>
            <select
              value={balancePaymentMethod}
              onChange={(e) => setBalancePaymentMethod(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Opcional —</option>
              <option value="DEBIT">Débito</option>
              <option value="PIX">PIX</option>
              <option value="CASH">Dinheiro</option>
            </select>
          </div>
          {balanceError && <p className="text-sm text-destructive">{balanceError}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setBalanceModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={balanceSaving}>
              {balanceSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando…
                </span>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function BillDueRow({
  transaction,
  onMarkPaid,
  markingPaid,
  formatMoney,
  formatDate,
}: {
  transaction: Transaction;
  onMarkPaid: () => void;
  markingPaid: boolean;
  formatMoney: (v: number) => string;
  formatDate: (s: string) => string;
}) {
  const due = new Date(transaction.dueDate);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isOverdue =
    transaction.type === 'FIXED' &&
    !transaction.isPaid &&
    due < startOfToday &&
    due.toDateString() !== today.toDateString();

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">{transaction.description}</p>
        <p className="text-sm text-muted-foreground">
          {formatDate(transaction.dueDate)}
          {transaction.card?.name && <span> • {transaction.card.name}</span>}
          {transaction.installmentNumber != null && transaction.installmentTotal != null && (
            <span> • {transaction.installmentNumber}/{transaction.installmentTotal}x</span>
          )}
          {isOverdue && <span className="ml-1 text-destructive">(atrasada)</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums text-destructive">
          {formatMoney(Math.abs(Number(transaction.amount)))}
        </span>
        <Button size="sm" onClick={onMarkPaid} disabled={markingPaid}>
          {markingPaid ? '…' : 'Pagar'}
        </Button>
      </div>
    </li>
  );
}
