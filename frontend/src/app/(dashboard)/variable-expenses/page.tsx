'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Wallet, BarChart3 } from 'lucide-react';
import { useTransactions } from '@/hooks/use-transactions';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
];

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function VariableExpensesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: transactions, isLoading } = useTransactions(year, month);

  const variableExpenses = useMemo(() => {
    if (!transactions) return [];
    return transactions
      .filter((t) => t.type === 'VARIABLE' && Number(t.amount) < 0)
      .map((t) => ({ ...t, absAmount: Math.abs(Number(t.amount)) }))
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [transactions]);

  const chartByCategory = useMemo(() => {
    const byCat: Record<string, number> = {};
    variableExpenses.forEach((t) => {
      const cat = (t.category || 'Outros').trim() || 'Outros';
      byCat[cat] = (byCat[cat] ?? 0) + t.absAmount;
    });
    return Object.entries(byCat)
      .map(([name, value], i) => ({
        name,
        total: value,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }))
      .sort((a, b) => b.total - a.total);
  }, [variableExpenses]);

  const totalVariable = useMemo(
    () => variableExpenses.reduce((s, t) => s + t.absAmount, 0),
    [variableExpenses]
  );

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="h-7 w-7" />
            Despesas variáveis
          </h1>
          <p className="text-muted-foreground">
            Lista e gráfico por categoria (gasolina, farmácia, mercado, etc.) — só despesas sem parcelas e não fixas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gráfico: maior gasto do mês por categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Maior gasto do mês por categoria
          </CardTitle>
          <CardDescription>
            {MONTHS[month - 1]} de {year}. Categorias exatamente como cadastradas (ex.: gasolina, farmácia, mercado).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Carregando…
            </div>
          ) : !chartByCategory.length ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma despesa variável neste mês.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Use categorias como gasolina, farmácia, mercado ao lançar pelo app ou Telegram.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm">
                Total despesas variáveis em {MONTHS[month - 1]}:{' '}
                <strong>{formatMoney(totalVariable)}</strong>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartByCategory}
                    layout="vertical"
                    margin={{ left: 20, right: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => formatMoney(v)} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(value: number | undefined) => [value != null ? formatMoney(value) : '—', 'Total']}
                      labelFormatter={(label) => `Categoria: ${label}`}
                    />
                    <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartByCategory}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {chartByCategory.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => (value != null ? formatMoney(value) : '—')} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Lista detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de despesas variáveis</CardTitle>
          <CardDescription>
            Data, descrição, categoria e valor — detalhado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Carregando…
            </div>
          ) : !variableExpenses.length ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              Nenhuma despesa variável neste mês.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variableExpenses.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{formatDate(t.dueDate)}</TableCell>
                    <TableCell>{t.description || '—'}</TableCell>
                    <TableCell>{t.category || 'Outros'}</TableCell>
                    <TableCell className="text-right text-destructive">
                      -{formatMoney(t.absAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
