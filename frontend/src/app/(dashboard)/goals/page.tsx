'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Target, Plus } from 'lucide-react';
import { useCategoryGoals, useSetCategoryGoal, useRemoveCategoryGoal } from '@/hooks/use-goals';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function GoalsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingLimit, setEditingLimit] = useState<Record<string, string>>({});

  const { data: categories, isLoading, mutate } = useCategoryGoals(year, month);
  const { setGoal } = useSetCategoryGoal();
  const { removeGoal } = useRemoveCategoryGoal();

  const years = [year, year - 1, year - 2];

  async function handleSetLimit(category: string, monthlyLimit: number) {
    setSaving(true);
    try {
      await setGoal(category, monthlyLimit);
      await mutate();
      if (monthlyLimit > 0) {
        toast.success(`Meta de ${formatMoney(monthlyLimit)} definida para ${category}.`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar meta.');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveLimit(category: string) {
    setSaving(true);
    try {
      await removeGoal(category);
      await mutate();
      toast.success(`Meta removida para ${category}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao remover meta.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error('Digite o nome da categoria.');
      return;
    }
    setSaving(true);
    try {
      await setGoal(name, 0);
      await mutate();
      setNewCategoryName('');
      setNewCategoryOpen(false);
      toast.success(`Categoria "${name}" adicionada. Defina a meta abaixo.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao criar categoria.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-7 w-7" />
            Metas
          </h1>
          <p className="text-muted-foreground">
            Crie categorias (gasolina, farmácia, mercado…) e defina um teto mensal. Ao ultrapassar, você será avisado. Categorias usadas no Telegram aparecem aqui automaticamente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={() => setNewCategoryOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova categoria
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Metas por categoria</CardTitle>
          <CardDescription>
            Defina um teto mensal (R$) por categoria. Você será avisado ao ultrapassar. Categorias que aparecem nas suas transações (incluindo do Telegram) já constam na lista.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Carregando…
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <Target className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Nenhuma categoria ainda.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Adicione uma categoria com o botão acima ou lance despesas pelo app/Telegram (ex: 100 gasolina) para elas aparecerem aqui.
              </p>
              <Button className="mt-4" onClick={() => setNewCategoryOpen(true)}>
                Nova categoria
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((item) => {
                const limit = item.limit ?? 0;
                const hasLimit = limit > 0;
                const exceeded = hasLimit && item.spent > limit;
                return (
                  <div
                    key={item.category}
                    className="flex flex-wrap items-center gap-3 rounded-lg border p-3"
                  >
                    <span className="font-medium min-w-[140px]">{item.category}</span>
                    <span className="tabular-nums text-muted-foreground">
                      Gasto: {formatMoney(item.spent)}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-muted-foreground">Meta (R$):</label>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        placeholder="Sem meta"
                        className="w-28 rounded border border-input bg-background px-2 py-1.5 text-sm"
                        value={
                          editingLimit[item.category] !== undefined
                            ? editingLimit[item.category]
                            : item.limit != null && item.limit > 0
                              ? String(item.limit)
                              : ''
                        }
                        onChange={(e) =>
                          setEditingLimit((prev) => ({ ...prev, [item.category]: e.target.value }))
                        }
                        onBlur={(e) => {
                          const v = e.target.value ? Number(e.target.value) : 0;
                          setEditingLimit((prev) => {
                            const next = { ...prev };
                            delete next[item.category];
                            return next;
                          });
                          if (v >= 0) handleSetLimit(item.category, v);
                        }}
                        disabled={saving}
                      />
                    </div>
                    {hasLimit && (
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          exceeded
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {exceeded ? 'Ultrapassou' : 'Dentro da meta'}
                      </span>
                    )}
                    {hasLimit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveLimit(item.category)}
                        disabled={saving}
                      >
                        Remover meta
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={newCategoryOpen}
        onClose={() => {
          if (!saving) setNewCategoryOpen(false);
        }}
        title="Nova categoria"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Digite o nome da categoria (ex: gasolina, farmácia, mercado). Depois você define a meta em R$.
          </p>
          <Input
            placeholder="Ex: gasolina"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNewCategoryOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleAddCategory} disabled={saving || !newCategoryName.trim()}>
              {saving ? 'Salvando…' : 'Adicionar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
