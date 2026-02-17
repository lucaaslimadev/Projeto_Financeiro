'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Search, Filter } from 'lucide-react';
import api from '@/lib/api';
import { useTransactions, useMarkAsPaid, useDeleteTransaction } from '@/hooks/use-transactions';
import { mutate as globalMutate } from 'swr';
import { useCards } from '@/hooks/use-cards';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { Transaction as Tx } from '@/types';
import type { TransactionType } from '@/types';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TransactionsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [modalOpen, setModalOpen] = useState(false);
  const [formType, setFormType] = useState<'variable' | 'recurring' | 'installment' | 'income'>('variable');

  const { data: transactions, isLoading } = useTransactions(year, month);
  const { data: cards } = useCards();
  const markPaid = useMarkAsPaid();
  const deleteTx = useDeleteTransaction();

  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Outros');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [recurringDay, setRecurringDay] = useState('10');
  const [installments, setInstallments] = useState('2');
  const [dueDay, setDueDay] = useState('10');
  const [cardId, setCardId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | ''>('');

  const filteredTransactions = useMemo(() => {
    let list = transactions ?? [];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.description.toLowerCase().includes(q) ||
          (t.category || '').toLowerCase().includes(q)
      );
    }
    if (filterType) {
      list = list.filter((t) => t.type === filterType);
    }
    return list;
  }, [transactions, searchQuery, filterType]);

  /** Categorias já usadas nas transações (para sugerir no formulário) */
  const suggestedCategories = useMemo(() => {
    const set = new Set<string>();
    transactions?.forEach((t) => {
      const c = (t.category || '').trim();
      if (c && c !== 'Telegram') set.add(c);
    });
    return Array.from(set).sort();
  }, [transactions]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (formType === 'income') {
        await api.post('/transactions/income', {
          description: desc,
          amount: Math.abs(Number(amount)),
          category,
          dueDate,
        });
      } else if (formType === 'variable') {
        await api.post('/transactions/variable', {
          description: desc,
          amount: -Math.abs(Number(amount)),
          category,
          dueDate,
          paymentMethod: paymentMethod && ['DEBIT', 'PIX', 'CASH', 'CREDIT'].includes(paymentMethod) ? paymentMethod : null,
        });
      } else if (formType === 'recurring') {
        await api.post('/transactions/recurring-fixed', {
          description: desc,
          amount: Math.abs(Number(amount)),
          category,
          recurringDay: Number(recurringDay),
        });
      } else {
        if (!cardId) throw new Error('Selecione um cartão');
        await api.post('/transactions/installment-card', {
          description: desc,
          totalAmount: Math.abs(Number(amount)),
          installments: Number(installments),
          dueDay: Number(dueDay),
          cardId,
          category,
        });
      }
      setModalOpen(false);
      resetForm();
      toast.success('Transação criada');
      await globalMutate((key) => Array.isArray(key) && (key[0] === 'transactions' || key[0] === 'dashboard'));
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data
        : null;
      setError(res?.message || 'Erro ao criar.');
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setDesc('');
    setAmount('');
    setCategory('Outros');
    setDueDate(new Date().toISOString().slice(0, 10));
    setRecurringDay('10');
    setInstallments('2');
    setDueDay('10');
    setCardId('');
    setPaymentMethod('');
    setFormType('variable');
  }

  function openDuplicate(t: Tx) {
    const amt = Math.abs(Number(t.amount));
    setDesc(t.description.replace(/\s*\(\d+\/\d+x?\)\s*$/, '').trim());
    setAmount(String(amt));
    setCategory(t.category || 'Outros');
    setDueDate(new Date().toISOString().slice(0, 10));
    setRecurringDay(t.recurringDay ? String(t.recurringDay) : '10');
    setInstallments(t.installmentTotal ? String(t.installmentTotal) : '2');
    setDueDay('10');
    setCardId(t.cardId || '');
    setPaymentMethod(t.paymentMethod || '');
    if (t.type === 'INCOME') setFormType('income');
    else if (t.type === 'FIXED') setFormType('recurring');
    else if (t.type === 'CARD') setFormType('installment');
    else setFormType('variable');
    setError('');
    setModalOpen(true);
  }

  function openEdit(t: Tx) {
    setEditId(t.id);
    setEditDesc(t.description);
    setEditAmount(String(Math.abs(Number(t.amount))));
    setEditDueDate(t.dueDate.slice(0, 10));
    setEditCategory(t.category || 'Outros');
    setEditError('');
    setEditSaving(false);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    const tx = transactions?.find((t) => t.id === editId);
    setEditError('');
    setEditSaving(true);
    try {
      const amount = Number(editAmount.replace(',', '.'));
      const body: { description?: string; amount?: number; dueDate?: string; category?: string } = {};
      if (editDesc.trim()) body.description = editDesc.trim();
      if (Number.isFinite(amount)) body.amount = (tx && Number(tx.amount) < 0) ? -amount : amount;
      if (editDueDate) body.dueDate = editDueDate;
      if (editCategory.trim()) body.category = editCategory.trim();
      await api.patch(`/transactions/${editId}`, body);
      toast.success('Transação atualizada');
      setEditId(null);
      await globalMutate((key) => Array.isArray(key) && (key[0] === 'transactions' || key[0] === 'dashboard'));
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data
        : null;
      setEditError(res?.message || 'Erro ao atualizar.');
    } finally {
      setEditSaving(false);
    }
  }

  const formTypeOptions = [
    { key: 'variable' as const, label: 'Variável' },
    { key: 'recurring' as const, label: 'Fixa' },
    { key: 'income' as const, label: 'Receita' },
    { key: 'installment' as const, label: 'Parcelado' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-blue-200/60 pb-2">
        <h1 className="text-2xl font-bold text-slate-800">Transações</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {[year, year - 1, year - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={() => { setModalOpen(true); setError(''); }}>Nova transação</Button>
        </div>
      </div>

      {(transactions?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar por descrição ou categoria"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={filterType}
              onChange={(e) => setFilterType((e.target.value || '') as TransactionType | '')}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos os tipos</option>
              <option value="VARIABLE">Variável</option>
              <option value="FIXED">Fixa</option>
              <option value="CARD">Cartão</option>
              <option value="INCOME">Receita</option>
              <option value="ADJUSTMENT">Ajuste</option>
            </select>
          </div>
        </div>
      )}

      <Card className="border-l-4 border-l-blue-500/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">Carregando transações…</p>
          </div>
        ) : !transactions?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4">
              <svg className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="mt-3 font-medium text-foreground">Nenhuma transação neste mês</p>
            <p className="mt-1 text-sm text-muted-foreground">Use &quot;Nova transação&quot; ou registre pelo Telegram</p>
          </div>
        ) : !filteredTransactions.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground" />
            <p className="mt-3 font-medium text-foreground">Nenhum resultado</p>
            <p className="mt-1 text-sm text-muted-foreground">Tente outro termo de busca ou filtro por tipo.</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredTransactions.map((t, i) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                even={i % 2 === 0}
                onMarkPaid={async () => {
                  await markPaid.mutateAsync(t.id);
                  toast.success('Marcada como paga');
                }}
                onDelete={() => setDeleteConfirmId(t.id)}
                onEdit={() => openEdit(t)}
                onDuplicate={() => openDuplicate(t)}
                markingPaid={markPaid.isPending}
                deleting={deleteTx.isPending}
              />
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Excluir transação?"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteTx.isPending}
              onClick={async () => {
                if (!deleteConfirmId) return;
                await deleteTx.mutateAsync(deleteConfirmId);
                toast.success('Transação excluída');
                setDeleteConfirmId(null);
                await globalMutate((key) => Array.isArray(key) && (key[0] === 'transactions' || key[0] === 'dashboard'));
              }}
            >
              {deleteTx.isPending ? 'Excluindo…' : 'Excluir'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={editId !== null} onClose={() => setEditId(null)} title="Editar transação">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input label="Descrição" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} required />
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            required
          />
          <Input label="Data" type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <input
              list="edit-category-suggestions"
              type="text"
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
            />
            <datalist id="edit-category-suggestions">
              {suggestedCategories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditId(null)}>Cancelar</Button>
            <Button type="submit" disabled={editSaving}>
              {editSaving ? (
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova transação">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
            {formTypeOptions.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFormType(key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  formType === key ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Input label="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} required />
          <Input
            label={formType === 'income' ? 'Valor (R$) — receita' : 'Valor (R$)'}
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
            <input
              list="category-suggestions"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              placeholder="Ex.: gasolina, farmácia, comida"
            />
            <datalist id="category-suggestions">
              {suggestedCategories.map((c) => (
                <option key={c} value={c} />
              ))}
              <option value="Alimentação" />
              <option value="Transporte" />
              <option value="Moradia" />
              <option value="Lazer" />
              <option value="Saúde" />
              <option value="Educação" />
              <option value="Outros" />
            </datalist>
          </div>

          {formType === 'variable' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Forma de pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                <option value="">— Opcional —</option>
                <option value="DEBIT">Débito</option>
                <option value="PIX">PIX</option>
                <option value="CASH">Dinheiro</option>
                <option value="CREDIT">Crédito</option>
              </select>
              <p className="text-xs text-slate-500 mt-0.5">Débito/PIX/dinheiro: pago na hora. Crédito: só despesa variável.</p>
            </div>
          )}

          {(formType === 'variable' || formType === 'income') && (
            <Input label="Data" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          )}
          {formType === 'recurring' && (
            <Input
              label="Dia do mês (1-31)"
              type="number"
              min={1}
              max={31}
              value={recurringDay}
              onChange={(e) => setRecurringDay(e.target.value)}
            />
          )}
          {formType === 'installment' && (
            <>
              <Input
                label="Parcelas"
                type="number"
                min={2}
                max={60}
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />
              <Input
                label="Dia venc. parcela (1-31)"
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cartão</label>
                <select
                  value={cardId}
                  onChange={(e) => setCardId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  required
                >
                  <option value="">Selecione</option>
                  {cards?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={submitting} className="min-w-[120px]">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Salvando…
                </span>
              ) : (
                'Criar'
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TransactionRow({
  transaction,
  onMarkPaid,
  onDelete,
  onEdit,
  onDuplicate,
  markingPaid,
  deleting,
  even,
}: {
  transaction: Tx;
  onMarkPaid: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  markingPaid: boolean;
  deleting: boolean;
  even?: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const due = new Date(transaction.dueDate);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isOverdue =
    transaction.type === 'FIXED' &&
    !transaction.isPaid &&
    due < startOfToday &&
    due.toDateString() !== today.toDateString();

  return (
    <li
      className={`py-3 flex flex-wrap items-center justify-between gap-2 ${even ? 'bg-slate-50/70 dark:bg-slate-900/30' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${transaction.isPaid ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
          {transaction.description}
        </p>
        <p className="text-sm text-slate-500">
          {formatDate(transaction.dueDate)}
          {transaction.type === 'VARIABLE' && transaction.paymentMethod && (
            <span> • {transaction.paymentMethod === 'DEBIT' ? 'Débito' : transaction.paymentMethod === 'PIX' ? 'PIX' : transaction.paymentMethod === 'CASH' ? 'Dinheiro' : 'Crédito'}</span>
          )}
          {transaction.type === 'CARD' && transaction.installmentNumber != null && (
            <span> • {transaction.installmentNumber}/{transaction.installmentTotal}x</span>
          )}
          {transaction.card?.name && <span> • {transaction.card.name}</span>}
          {isOverdue && <span className="text-red-600 ml-1">(atrasada)</span>}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${Number(transaction.amount) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {formatMoney(Number(transaction.amount))}
        </span>
        {showActions && !transaction.isPaid && (
          <Button size="sm" variant="ghost" onClick={onMarkPaid} disabled={markingPaid}>
            {markingPaid ? '…' : 'Pagar'}
          </Button>
        )}
        {showActions && (
          <>
            <Button size="sm" variant="ghost" onClick={onEdit} className="text-slate-600">
              Editar
            </Button>
            <Button size="sm" variant="ghost" onClick={onDuplicate} className="text-slate-600">
              Duplicar
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete} disabled={deleting} className="text-red-600">
              {deleting ? '…' : 'Excluir'}
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
