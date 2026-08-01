import { api } from '../lib/api';

export interface MonthlySummary {
  monthlyData: { month: string; income: number; expenses: number }[];
  totals: {
    totalIncome: number;
    totalExpenses: number;
    ownerDistributions: number;
    netIncome: number;
  };
  categoryBreakdown: { name: string; value: number }[];
  incomeByType: { name: string; value: number }[];
}

export interface ActionItems {
  uncategorizedCount: number;
  budgetAlerts: number;
  pendingReceipts: number;
}

export const reportsService = {
  async getMonthlySummary(startDate: string, endDate: string): Promise<MonthlySummary> {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<MonthlySummary>(`/reports/monthly-summary?${params.toString()}`);
    return response.data;
  },

  async getActionItems(): Promise<ActionItems> {
    const response = await api.get<ActionItems>('/reports/action-items');
    return response.data;
  },
};
