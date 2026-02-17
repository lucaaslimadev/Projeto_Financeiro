import { useState, useCallback } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import api from '@/lib/api';
import type { Card } from '@/types';

export function useCards() {
  return useSWR<Card[]>(['cards'], () => api.get('/cards').then((r) => r.data));
}

export function useCreateCard() {
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = useCallback(async (body: { name: string; limit: number; closingDay: number; dueDay: number }) => {
    setIsPending(true);
    try {
      await api.post('/cards', body);
      await globalMutate(['cards']);
    } finally {
      setIsPending(false);
    }
  }, []);
  return { mutateAsync, isPending };
}

export function useUpdateCard() {
  const [isPending, setIsPending] = useState(false);
  const mutateAsync = useCallback(async (args: { id: string; name?: string; limit?: number; closingDay?: number; dueDay?: number }) => {
    const { id, ...body } = args;
    setIsPending(true);
    try {
      await api.patch(`/cards/${id}`, body);
      await globalMutate(['cards']);
      await globalMutate((key) => Array.isArray(key) && key[0] === 'dashboard');
    } finally {
      setIsPending(false);
    }
  }, []);
  return { mutateAsync, isPending };
}
