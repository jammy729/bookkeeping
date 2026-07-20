import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsService, type CreateClientDto, type UpdateClientDto } from '../services/clients.service';

export function useClients(activeOnly?: boolean) {
  return useQuery({
    queryKey: ['clients', { activeOnly }],
    queryFn: () => clientsService.getAll(activeOnly),
  });
}

export function useClientMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  };

  const create = useMutation({
    mutationFn: (data: CreateClientDto) => clientsService.create(data),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      clientsService.update(id, data),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => clientsService.delete(id),
    onSuccess: invalidateAll,
  });

  return { create, update, remove };
}
