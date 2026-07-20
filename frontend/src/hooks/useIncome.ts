import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  incomeService,
  type CreateIncomeDto,
  type UpdateIncomeDto,
  type IncomeFilters,
} from '../services/income.service';

export function useIncome(filters?: IncomeFilters) {
  return useQuery({
    queryKey: ['income', filters],
    queryFn: () => incomeService.getAll(filters),
  });
}

export function useIncomeTotal(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['income', 'total', { startDate, endDate }],
    queryFn: () => incomeService.getTotal(startDate, endDate),
  });
}

export function useIncomeByType(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['income', 'by-type', { startDate, endDate }],
    queryFn: () => incomeService.getByType(startDate, endDate),
  });
}

export function useIncomeByClient(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['income', 'by-client', { startDate, endDate }],
    queryFn: async () => {
      const res = await api.get(`/income/summary/by-client?startDate=${startDate}&endDate=${endDate}`);
      return res.data as { clientName: string; total: number; count: number }[];
    },
  });
}

export function useIncomeMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['income'] });
  };

  const create = useMutation({
    mutationFn: (data: CreateIncomeDto) => incomeService.create(data),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncomeDto }) =>
      incomeService.update(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => incomeService.delete(id),
    onSuccess: invalidateAll,
  });

  return { create, update, remove };
}
