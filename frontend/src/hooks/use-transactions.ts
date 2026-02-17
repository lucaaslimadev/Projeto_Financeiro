import { useState, useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import api from '@/lib/api';
import type { Transaction } from '@/types';

export function useTransactions(year: number, month: number) {
  return useSWR<Transaction[]>(
    ['transactions', year, month],
    () => api.get(`/transactions?year=${year}&month=${month}`).then((r) => r.data)
  );
}

export function useMarkAsPaid() {
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = useCallback(async (id: string) => {
    setIsPending(true);
    try {
      await api.patch(`/transactions/${id}/paid`);
      await globalMutate((key) => Array.isArray(key) && (key[0] === 'transactions' || key[0] === 'dashboard'));
    } finally {
      setIsPending(false);
    }
  }, []);
  return { mutateAsync, isPending };
}

export function useDeleteTransaction() {
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = useCallback(async (id: string) => {
    setIsPending(true);
    try {
      await api.delete(`/transactions/${id}`);
      await globalMutate((key) => Array.isArray(key) && (key[0] === 'transactions' || key[0] === 'dashboard'));
    } finally {
      setIsPending(false);
    }
  }, []);
  return { mutateAsync, isPending };
}
