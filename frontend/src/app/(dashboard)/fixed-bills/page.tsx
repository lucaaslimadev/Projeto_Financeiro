'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { mutate as globalMutate } from 'swr';
import { useTransactions } from '@/hooks/use-transactions';
import { useMarkAsPaid, useDeleteTransaction } from '@/hooks/use-transactions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { FileText } from 'lucide-react';
import type { Transaction } from '@/types';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function FixedBillsPage() {
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [modalOpen, setModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Outros');
  const [recurringDay, setRecurringDay] = useState('10');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: transactions, isLoading } = useTransactions(year, month);
  const markPaid = useMarkAsPaid();
  const deleteTx = useDeleteTransaction();

  const fixedBills = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter((t) => t.type === 'FIXED');
  }, [transactions]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/transactions/recurring-fixed', {
        description: desc,
        amount: Math.abs(Number(amount)),
        category: category || 'Outros',
        recurringDay: Number(recurringDay),
      });
      setModalOpen(false);
      setDesc('');
      setAmount('');
      setCategory('Outros');
      setRecurringDay('10');
      toast.success('Conta fixa adicionada');
      await globalMutate((key) =>
        Array.isArray(key) && (key[0] === 'transactions' || key[0] === 'dashboard')
      );
    } catch (err: unknown) {
      const res =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data
          : null;
      setError(res?.message || 'Erro ao criar conta fixa.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200/60 dark:border-amber-800/40 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Contas Fixas</h1>
          <p className="text-muted-foreground">
            Contas que se repetem todo mês (aluguel, internet, etc.)
          </p>
        </div>
        <Button onClick={() => { setModalOpen(true); setError(''); }} className="gap-2">
          <FileText className="h-4 w-4" />
          Adicionar conta fixa
        </Button>
      </div>

      <Card className="border-l-4 border-l-amber-500/70">
        <CardHeader>
          <CardTitle>Suas contas fixas</CardTitle>
          <CardDescription>
            Lista das contas recorrentes no mês. O sistema gera automaticamente a transação todo mês no dia definido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="mt-3 text-sm text-muted-foreground">Carregando…</p>
            </div>
          ) : fixedBills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted p-4">
                <FileText className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="mt-3 font-medium text-foreground">Nenhuma conta fixa cadastrada</p>
              <p className="mt-1 text-sm text-muted-foreground">Clique em &quot;Adicionar conta fixa&quot; para criar (aluguel, internet, etc.)</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {fixedBills.map((t) => (
                <FixedBillRow
                  key={t.id}
                  transaction={t}
                  onMarkPaid={async () => {
                    await markPaid.mutateAsync(t.id);
                    toast.success('Conta marcada como paga');
                  }}
                  onDelete={() => setDeleteConfirmId(t.id)}
                  markingPaid={markPaid.isPending}
                  deleting={deleteTx.isPending}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar conta fixa">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Descrição"
            placeholder="Ex.: Aluguel, Internet"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            required
          />
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Categoria"
            placeholder="Ex.: Moradia"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            label="Dia do vencimento (1-31)"
            type="number"
            min={1}
            max={31}
            value={recurringDay}
            onChange={(e) => setRecurringDay(e.target.value)}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Salvando…' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} title="Excluir conta fixa?">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancelar</Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteTx.isPending}
              onClick={async () => {
                if (!deleteConfirmId) return;
                await deleteTx.mutateAsync(deleteConfirmId);
                toast.success('Conta fixa excluída');
                setDeleteConfirmId(null);
                await globalMutate((key) => Array.isArray(key) && (key[0] === 'transactions' || key[0] === 'dashboard'));
              }}
            >
              {deleteTx.isPending ? 'Excluindo…' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FixedBillRow({
  transaction,
  onMarkPaid,
  onDelete,
  markingPaid,
  deleting,
}: {
  transaction: Transaction;
  onMarkPaid: () => void;
  onDelete: () => void;
  markingPaid: boolean;
  deleting: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const due = new Date(transaction.dueDate);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const looksLikeCardInstallment = /^\d+x\s+cart[ãa]o|cart[ãa]o\s+/i.test(transaction.description);
  const isOverdue =
    transaction.type === 'FIXED' &&
    !looksLikeCardInstallment &&
    !transaction.isPaid &&
    due < startOfToday &&
    due.toDateString() !== today.toDateString();

  return (
    <li
      className="flex flex-wrap items-center justify-between gap-2 py-3"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="min-w-0 flex-1">
        <p
          className={`font-medium ${
            transaction.isPaid ? 'text-muted-foreground line-through' : 'text-foreground'
          }`}
        >
          {transaction.description}
        </p>
        <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-1.5">
          {formatDate(transaction.dueDate)}
          {transaction.recurringDay != null && (
            <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              Dia {transaction.recurringDay}
            </span>
          )}
          {isOverdue && <span className="text-destructive">(atrasada)</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`font-semibold tabular-nums ${
            Number(transaction.amount) < 0
              ? 'text-destructive'
              : 'text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {formatMoney(Number(transaction.amount))}
        </span>
        {showActions && !transaction.isPaid && (
          <Button size="sm" variant="ghost" onClick={onMarkPaid} disabled={markingPaid}>
            {markingPaid ? '…' : 'Pagar'}
          </Button>
        )}
        {showActions && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            disabled={deleting}
            className="text-destructive"
          >
            {deleting ? '…' : 'Excluir'}
          </Button>
        )}
      </div>
    </li>
  );
}
