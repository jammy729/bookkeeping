import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  expensesService,
  type CreateExpenseDto,
  type UpdateExpenseDto,
  type ExpensesFilters,
} from '../services/expenses.service';

export function useExpenses(filters?: ExpensesFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expensesService.getAll(filters),
  });
}

export function useExpenseTotal(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['expenses', 'total', { startDate, endDate }],
    queryFn: () => expensesService.getTotal(startDate, endDate),
  });
}

export function useExpenseByCategory(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['expenses', 'by-category', { startDate, endDate }],
    queryFn: () => expensesService.getByCategory(startDate, endDate),
  });
}

export function useExpenseMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
  };

  const create = useMutation({
    mutationFn: (data: CreateExpenseDto) => expensesService.create(data),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseDto }) =>
      expensesService.update(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => expensesService.delete(id),
    onSuccess: invalidateAll,
  });

  return { create, update, remove };
}
