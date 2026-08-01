import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesService, type CreateInvoiceDto, type UpdateInvoiceDto } from '../services/invoices.service';

export function useInvoices(status?: string) {
  return useQuery({
    queryKey: ['invoices', { status }],
    queryFn: () => invoicesService.getAll(status),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoicesService.getById(id),
    enabled: !!id,
  });
}

export function useInvoiceSummary() {
  return useQuery({
    queryKey: ['invoices', 'summary'],
    queryFn: () => invoicesService.getSummary(),
  });
}

export function useInvoiceMutations() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
  };

  const create = useMutation({
    mutationFn: (data: CreateInvoiceDto) => invoicesService.create(data),
    onSuccess: invalidateAll,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceDto }) =>
      invoicesService.update(id, data),
    onSuccess: invalidateAll,
  });

  const markAsSent = useMutation({
    mutationFn: (id: string) => invoicesService.markAsSent(id),
    onSuccess: invalidateAll,
  });

  const markAsPaid = useMutation({
    mutationFn: (id: string) => invoicesService.markAsPaid(id),
    onSuccess: invalidateAll,
  });

  const remove = useMutation({
    mutationFn: (id: string) => invoicesService.delete(id),
    onSuccess: invalidateAll,
  });

  return { create, update, markAsSent, markAsPaid, remove };
}
