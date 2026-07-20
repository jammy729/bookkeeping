import { api } from '../lib/api';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  notes: string | null;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseDto {
  amount: number;
  description: string;
  date: string;
  categoryId?: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface UpdateExpenseDto {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string;
  notes?: string;
  isRecurring?: boolean;
}

export interface ExpensesFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
}

export const expensesService = {
  async getAll(filters?: ExpensesFilters): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    
    const response = await api.get<Expense[]>(`/expenses?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Expense> {
    const response = await api.get<Expense>(`/expenses/${id}`);
    return response.data;
  },

  async create(data: CreateExpenseDto): Promise<Expense> {
    const response = await api.post<Expense>('/expenses', data);
    return response.data;
  },

  async update(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const response = await api.put<Expense>(`/expenses/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  async getTotal(startDate: string, endDate: string): Promise<number> {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<number>(`/expenses/summary/total?${params.toString()}`);
    return response.data;
  },

  async getByCategory(startDate: string, endDate: string): Promise<{ categoryId: string; categoryName: string; total: number }[]> {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<{ categoryId: string; categoryName: string; total: number }[]>(`/expenses/summary/by-category?${params.toString()}`);
    return response.data;
  },
};
