'use client';

import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { useCards, useCreateCard, useUpdateCard } from '@/hooks/use-cards';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import type { Card as CardType } from '@/types';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function CardsPage() {
  const { data: cards, isLoading } = useCards();
  const createCard = useCreateCard();
  const updateCard = useUpdateCard();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<CardType | null>(null);

  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('15');
  const [dueDay, setDueDay] = useState('22');
  const [error, setError] = useState('');

  function openCreate() {
    setName('');
    setLimit('');
    setClosingDay('15');
    setDueDay('22');
    setError('');
    setCreateOpen(true);
  }

  function openEdit(c: CardType) {
    setEditing(c);
    setName(c.name);
    setLimit(String(c.limit));
    setClosingDay(String(c.closingDay));
    setDueDay(String(c.dueDay));
    setError('');
  }

  function closeModals() {
    setCreateOpen(false);
    setEditing(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await createCard.mutateAsync({
        name,
        limit: Number(limit),
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
      });
      closeModals();
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data
        : null;
      setError(res?.message || 'Erro ao criar.');
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError('');
    try {
      await updateCard.mutateAsync({
        id: editing.id,
        name,
        limit: Number(limit),
        closingDay: Number(closingDay),
        dueDay: Number(dueDay),
      });
      closeModals();
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data
        : null;
      setError(res?.message || 'Erro ao salvar.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-200/60 pb-2">
        <h1 className="text-2xl font-bold text-slate-800">Cartões</h1>
        <Button onClick={openCreate}>Novo cartão</Button>
      </div>

      {isLoading ? (
        <p className="text-slate-500 py-8">Carregando…</p>
      ) : !cards?.length ? (
        <Card>
          <p className="text-slate-500 py-8 text-center">Nenhum cartão. Cadastre o primeiro.</p>
          <div className="flex justify-center">
            <Button onClick={openCreate}>Novo cartão</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c) => (
            <Card key={c.id} className="border-l-4 border-l-indigo-500 hover:border-indigo-600/50 transition">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">{c.name}</p>
                  <p className="text-lg font-bold text-slate-700 mt-1">{formatMoney(Number(c.limit))}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Fecha dia {c.closingDay} • Vence dia {c.dueDay}
                  </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Editar</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={createOpen} onClose={closeModals} title="Novo cartão">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Limite (R$)"
            type="number"
            step="0.01"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
          />
          <Input
            label="Dia do fechamento (1-31)"
            type="number"
            min={1}
            max={31}
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
          />
          <Input
            label="Dia do vencimento (1-31)"
            type="number"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModals}>Cancelar</Button>
            <Button type="submit" disabled={createCard.isPending}>
              {createCard.isPending ? 'Salvando…' : 'Criar'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editing} onClose={closeModals} title="Editar cartão">
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Limite (R$)"
            type="number"
            step="0.01"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
          />
          <Input
            label="Dia do fechamento (1-31)"
            type="number"
            min={1}
            max={31}
            value={closingDay}
            onChange={(e) => setClosingDay(e.target.value)}
          />
          <Input
            label="Dia do vencimento (1-31)"
            type="number"
            min={1}
            max={31}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeModals}>Cancelar</Button>
            <Button type="submit" disabled={updateCard.isPending}>
              {updateCard.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
