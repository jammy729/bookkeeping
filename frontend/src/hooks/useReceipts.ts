import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadsService } from '../services/uploads.service';

export function useReceipts() {
  return useQuery({
    queryKey: ['receipts'],
    queryFn: () => uploadsService.list('receipt'),
  });
}

export function useExpenseAttachments(expenseId: string | undefined) {
  return useQuery({
    queryKey: ['attachments', 'expense', expenseId],
    queryFn: () => uploadsService.list('expense', expenseId),
    enabled: !!expenseId,
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, entityType, entityId }: { file: File; entityType?: string; entityId?: string }) =>
      uploadsService.upload(file, entityType || 'receipt', entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
  });
}

export function useDeleteReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => uploadsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
  });
}

export function useLinkReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, entityType, entityId }: { id: string; entityType: string; entityId: string }) =>
      uploadsService.link(id, entityType, entityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
  });
}

export function useUnlinkReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => uploadsService.unlink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['attachments'] });
    },
  });
}

export function useReceiptUrl(id: string | null) {
  return useQuery({
    queryKey: ['receipt-url', id],
    queryFn: () => uploadsService.getUrl(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 50,
  });
}
