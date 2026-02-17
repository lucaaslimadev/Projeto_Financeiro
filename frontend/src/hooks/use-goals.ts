import useSWR from 'swr';
import api from '@/lib/api';
import type { CategoryGoalItem } from '@/types';

function currentYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function useCategoryGoals(year?: number, month?: number) {
  const { year: y, month: m } = year && month ? { year, month } : currentYearMonth();
  const { data, isLoading, mutate } = useSWR<CategoryGoalItem[]>(
    ['goals', y, m],
    () => api.get(`/goals?year=${y}&month=${m}`).then((r) => r.data)
  );
  return {
    data: data ?? [],
    isLoading,
    mutate,
  };
}

export function useSetCategoryGoal() {
  const setGoal = async (category: string, monthlyLimit: number) => {
    await api.post('/goals', { category: category.trim(), monthlyLimit });
  };
  return { setGoal };
}

export function useRemoveCategoryGoal() {
  const removeGoal = async (category: string) => {
    await api.delete('/goals', { data: { category: category.trim() } });
  };
  return { removeGoal };
}
