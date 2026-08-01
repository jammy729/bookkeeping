import { api } from '../lib/api';

export interface Budget {
  id: string;
  name: string | null;
  amount: number;
  spent: number;
  period: string;
  startDate: string;
  endDate: string;
  categoryId?: string;
  category?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetDto {
  name?: string;
  amount: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  categoryId?: string;
}

export interface UpdateBudgetDto {
  name?: string;
  amount?: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}

export interface BudgetSummary {
  totalBudgets: number;
  totalAmount: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
}

export const budgetsService = {
  async getAll(): Promise<Budget[]> {
    const response = await api.get<Budget[]>('/budgets');
    return response.data;
  },

  async getById(id: string): Promise<Budget> {
    const response = await api.get<Budget>(`/budgets/${id}`);
    return response.data;
  },

  async getSummary(): Promise<BudgetSummary> {
    const response = await api.get<BudgetSummary>('/budgets/summary');
    return response.data;
  },

  async create(data: CreateBudgetDto): Promise<Budget> {
    const response = await api.post<Budget>('/budgets', data);
    return response.data;
  },

  async update(id: string, data: UpdateBudgetDto): Promise<Budget> {
    const response = await api.patch<Budget>(`/budgets/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/budgets/${id}`);
  },
};
