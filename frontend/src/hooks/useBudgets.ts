import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsService, type CreateBudgetDto, type UpdateBudgetDto } from '../services/budgets.service';

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: () => budgetsService.getAll(),
  });
}

export function useBudgetSummary() {
  return useQuery({
    queryKey: ['budgets', 'summary'],
    queryFn: () => budgetsService.getSummary(),
  });
}

export function useBudgetMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  };

  const create = useMutation({
    mutationFn: (data: CreateBudgetDto) => budgetsService.create(data),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBudgetDto }) =>
      budgetsService.update(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => budgetsService.delete(id),
    onSuccess: invalidateAll,
  });

  return { create, update, remove };
}
