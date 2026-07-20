import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesService, type CreateCategoryDto, type UpdateCategoryDto } from '../services/categories.service';

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['categories', 'expenses'],
    queryFn: () => categoriesService.getExpenseCategories(),
  });
}

export function useIncomeCategories() {
  return useQuery({
    queryKey: ['categories', 'incomes'],
    queryFn: () => categoriesService.getIncomeCategories(),
  });
}

export function useAllCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getAll(),
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const create = useMutation({
    mutationFn: (data: CreateCategoryDto) => categoriesService.create(data),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoriesService.update(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: invalidateAll,
  });

  return { create, update, remove };
}
