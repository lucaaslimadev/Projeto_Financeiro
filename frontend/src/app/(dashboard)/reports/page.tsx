'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, Download, FileText, Percent } from 'lucide-react';
import { useYearReport } from '@/hooks/use-dashboard';
import { useTransactions } from '@/hooks/use-transactions';
import { Button } from '@/components/ui/button';

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
];

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [exportMonth, setExportMonth] = useState(now.getMonth() + 1);
  const [exportYear, setExportYear] = useState(now.getFullYear());
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const { data: yearReport, isLoading } = useYearReport(year);
  const { data: transactionsForExport } = useTransactions(exportYear, exportMonth);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2];
  }, []);

  // 1) Comparativo entre meses (receitas vs despesas)
  const comparativoMeses = useMemo(() => {
    if (!yearReport?.monthlyBreakdown) return [];
    return yearReport.monthlyBreakdown.map((m) => ({
      mes: m.monthLabel,
      receitas: m.receitas,
      despesas: m.despesas,
      saldo: m.saldo,
    }));
  }, [yearReport]);

  // 2) Resumo anual + trimestres
  const resumoTrimestres = useMemo(() => {
    if (!yearReport?.monthlyBreakdown) return [];
    const q = [
      { label: 'Q1 (Jan–Mar)', receitas: 0, despesas: 0 },
      { label: 'Q2 (Abr–Jun)', receitas: 0, despesas: 0 },
      { label: 'Q3 (Jul–Set)', receitas: 0, despesas: 0 },
      { label: 'Q4 (Out–Dez)', receitas: 0, despesas: 0 },
    ];
    yearReport.monthlyBreakdown.forEach((m, i) => {
      const qIndex = Math.floor(i / 3);
      q[qIndex].receitas += m.receitas;
      q[qIndex].despesas += m.despesas;
    });
    return q.map((t) => ({ ...t, saldo: t.receitas - t.despesas }));
  }, [yearReport]);

  // 4) Evolução por tipo (variável, fixa, cartão)
  const evolucaoPorTipo = useMemo(() => {
    if (!yearReport?.monthlyBreakdown) return [];
    return yearReport.monthlyBreakdown.map((m) => ({
      mes: m.monthLabel,
      Variável: m.variable,
      Fixa: m.fixed,
      Cartão: m.card,
    }));
  }, [yearReport]);

  // 6) Indicadores
  const indicadores = useMemo(() => {
    if (!yearReport?.yearTotals) return null;
    const { receitas, despesas, saldo } = yearReport.yearTotals;
    const taxaEconomia = receitas > 0 ? (saldo / receitas) * 100 : 0;
    const pesoFixas =
      despesas > 0 && yearReport.monthlyBreakdown
        ? (yearReport.monthlyBreakdown.reduce((s, m) => s + m.fixed, 0) / despesas) * 100
        : 0;
    const pesoVariavel =
      despesas > 0 && yearReport.monthlyBreakdown
        ? (yearReport.monthlyBreakdown.reduce((s, m) => s + m.variable, 0) / despesas) * 100
        : 0;
    const pesoCartao =
      despesas > 0 && yearReport.monthlyBreakdown
        ? (yearReport.monthlyBreakdown.reduce((s, m) => s + m.card, 0) / despesas) * 100
        : 0;
    return { taxaEconomia, pesoFixas, pesoVariavel, pesoCartao };
  }, [yearReport]);

  // 7) Top categorias no ano (dados já vêm ordenados)
  const topCategoriasAno = useMemo(() => {
    if (!yearReport?.categoryTotalsYear?.length) return [];
    return yearReport.categoryTotalsYear.slice(0, 10).map((c, i) => ({
      name: c.category,
      total: c.total,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));
  }, [yearReport]);

  function handleExportCsv() {
    if (!transactionsForExport?.length) {
      toast.error('Nenhuma transação no mês selecionado.');
      return;
    }
    setExportingCsv(true);
    try {
      const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo'];
      const rows = [...transactionsForExport]
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .map((t) => [
          new Date(t.dueDate).toLocaleDateString('pt-BR'),
          t.description,
          t.category,
          String(t.amount),
          t.type,
        ]);
      const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transacoes_${exportYear}_${String(exportMonth).padStart(2, '0')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exportado.');
    } finally {
      setExportingCsv(false);
    }
  }

  function handleExportPdfAno() {
    if (!yearReport) return;
    setExportingPdf(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(`Relatório anual ${year}`, 14, 20);
      doc.setFontSize(11);
      let y = 32;
      const { receitas, despesas, saldo } = yearReport.yearTotals;
      doc.text(`Receitas: ${formatMoney(receitas)}`, 14, y); y += 7;
      doc.text(`Despesas: ${formatMoney(despesas)}`, 14, y); y += 7;
      doc.text(`Saldo do ano: ${formatMoney(saldo)}`, 14, y); y += 12;
      doc.setFontSize(12);
      doc.text('Por trimestre', 14, y); y += 7;
      doc.setFontSize(10);
      resumoTrimestres.forEach((t) => {
        doc.text(`${t.label} - Receitas: ${formatMoney(t.receitas)} | Despesas: ${formatMoney(t.despesas)} | Saldo: ${formatMoney(t.saldo)}`, 14, y);
        y += 6;
      });
      y += 6;
      doc.setFontSize(12);
      doc.text('Top categorias no ano', 14, y); y += 7;
      doc.setFontSize(10);
      yearReport.categoryTotalsYear.slice(0, 10).forEach((c) => {
        doc.text(`${c.category}: ${formatMoney(c.total)}`, 14, y);
        y += 6;
      });
      doc.save(`relatorio_anual_${year}.pdf`);
      toast.success('PDF exportado.');
    } finally {
      setExportingPdf(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-7 w-7" />
            Relatórios
          </h1>
          <p className="text-muted-foreground">
            Visão analítica: comparativo mensal, resumo anual, evolução por tipo, indicadores e exportação.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <span className="text-sm text-muted-foreground">ano</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          Carregando relatório…
        </div>
      ) : !yearReport ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          Nenhum dado disponível para o ano selecionado.
        </div>
      ) : (
        <>
          {/* 1) Comparativo entre meses (receitas vs despesas) */}
          <Card>
            <CardHeader>
              <CardTitle>Comparativo entre meses</CardTitle>
              <CardDescription>
                Receitas e despesas por mês em {year}. Últimos 12 meses do ano.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparativoMeses} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Legend />
                    <Bar dataKey="receitas" name="Receitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 2) Resumo anual */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo anual</CardTitle>
              <CardDescription>
                Totais de {year}. Receitas, despesas e saldo do ano.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Receitas</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatMoney(yearReport.yearTotals.receitas)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Despesas</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatMoney(yearReport.yearTotals.despesas)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Saldo do ano</p>
                  <p
                    className={`text-2xl font-bold ${
                      yearReport.yearTotals.saldo >= 0 ? 'text-emerald-600' : 'text-destructive'
                    }`}
                  >
                    {formatMoney(yearReport.yearTotals.saldo)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-muted-foreground">Por trimestre</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {resumoTrimestres.map((t) => (
                  <div key={t.label} className="rounded border bg-muted/30 px-3 py-2 text-sm">
                    <p className="font-medium">{t.label}</p>
                    <p className="text-muted-foreground">
                      Receitas {formatMoney(t.receitas)} · Despesas {formatMoney(t.despesas)}
                    </p>
                    <p className={t.saldo >= 0 ? 'text-emerald-600' : 'text-destructive'}>
                      Saldo {formatMoney(t.saldo)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3) Ano anterior vs ano atual */}
          <Card>
            <CardHeader>
              <CardTitle>Ano anterior vs ano atual</CardTitle>
              <CardDescription>
                Comparativo: {year - 1} vs {year} (totais do ano).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-muted-foreground">{year - 1}</p>
                  <p className="mt-1">Receitas: {formatMoney(yearReport.previousYearTotals.receitas)}</p>
                  <p>Despesas: {formatMoney(yearReport.previousYearTotals.despesas)}</p>
                  <p
                    className={
                      yearReport.previousYearTotals.saldo >= 0 ? 'text-emerald-600' : 'text-destructive'
                    }
                  >
                    Saldo: {formatMoney(yearReport.previousYearTotals.saldo)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-muted-foreground">{year}</p>
                  <p className="mt-1">Receitas: {formatMoney(yearReport.yearTotals.receitas)}</p>
                  <p>Despesas: {formatMoney(yearReport.yearTotals.despesas)}</p>
                  <p
                    className={
                      yearReport.yearTotals.saldo >= 0 ? 'text-emerald-600' : 'text-destructive'
                    }
                  >
                    Saldo: {formatMoney(yearReport.yearTotals.saldo)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 4) Evolução por tipo de despesa */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução por tipo de despesa</CardTitle>
              <CardDescription>
                Despesa variável, conta fixa e cartão ao longo dos meses de {year}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={evolucaoPorTipo} margin={{ top: 10, right: 20, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <Tooltip formatter={(v: number) => formatMoney(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="Variável" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Fixa" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Cartão" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* 5) Central de exportação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Exportação
              </CardTitle>
              <CardDescription>
                Exportar CSV do mês ou PDF do resumo anual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">CSV (transações do mês):</span>
                <select
                  value={exportMonth}
                  onChange={(e) => setExportMonth(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select
                  value={exportYear}
                  onChange={(e) => setExportYear(Number(e.target.value))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  disabled={exportingCsv}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {exportingCsv ? 'Exportando…' : 'Exportar CSV'}
                </Button>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPdfAno}
                  disabled={exportingPdf}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {exportingPdf ? 'Exportando…' : `PDF resumo anual ${year}`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 6) Indicadores rápidos */}
          {indicadores && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Indicadores
                </CardTitle>
                <CardDescription>
                  Taxa de economia e composição das despesas em {year}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Taxa de economia</p>
                    <p className="text-xl font-bold">
                      {formatPercent(indicadores.taxaEconomia)}
                    </p>
                    <p className="text-xs text-muted-foreground">Saldo / Receitas</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Despesas fixas</p>
                    <p className="text-xl font-bold">{formatPercent(indicadores.pesoFixas)}</p>
                    <p className="text-xs text-muted-foreground">do total de despesas</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Despesas variáveis</p>
                    <p className="text-xl font-bold">{formatPercent(indicadores.pesoVariavel)}</p>
                    <p className="text-xs text-muted-foreground">do total de despesas</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">Cartão</p>
                    <p className="text-xl font-bold">{formatPercent(indicadores.pesoCartao)}</p>
                    <p className="text-xs text-muted-foreground">do total de despesas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 7) Top categorias no ano */}
          <Card>
            <CardHeader>
              <CardTitle>Top categorias no ano</CardTitle>
              <CardDescription>
                Onde mais você gastou em {year}. Top 10 categorias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {topCategoriasAno.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum gasto por categoria neste ano.</p>
              ) : (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCategoriasAno}
                      layout="vertical"
                      margin={{ left: 20, right: 30 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => formatMoney(v)} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => formatMoney(v)} />
                      <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6">
              <div>
                <p className="font-medium text-foreground">Gastos por categoria no mês</p>
                <p className="text-sm text-muted-foreground">
                  Lista e gráfico detalhados de despesas variáveis.
                </p>
              </div>
              <Button asChild variant="default" className="shrink-0">
                <Link href="/variable-expenses" className="inline-flex items-center gap-2">
                  Despesas variáveis
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
