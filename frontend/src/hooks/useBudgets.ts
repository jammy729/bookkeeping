import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

interface Budget {
  id: string;
  name: string;
  amount: number;
  period: string;
  categoryId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateBudgetDto {
  name: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  categoryId?: string;
  notes?: string;
}

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const res = await api.get<Budget[]>('/budgets');
      return res.data;
    },
  });
}

export function useBudgetMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  const create = useMutation({
    mutationFn: (data: CreateBudgetDto) =>
      api.post('/budgets', data).then((res) => res.data),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateBudgetDto> }) =>
      api.put(`/budgets/${id}`, data).then((res) => res.data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/budgets/${id}`),
    onSuccess: invalidateAll,
  });

  return { create, update, remove };
}
