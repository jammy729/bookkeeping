import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../services/reports.service';

export function useMonthlySummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['reports', 'monthly-summary', { startDate, endDate }],
    queryFn: () => reportsService.getMonthlySummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useActionItems() {
  return useQuery({
    queryKey: ['reports', 'action-items'],
    queryFn: () => reportsService.getActionItems(),
  });
}
