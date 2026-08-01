import { api } from '../lib/api';

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  notes: string | null;
  isRecurring: boolean;
  recurrenceFrequency: RecurrenceFrequency | null;
  nextOccurrence: string | null;
  attachments?: { id: string; originalName: string; mimeType: string; size: number }[];
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
  recurrenceFrequency?: RecurrenceFrequency;
  nextOccurrence?: string;
}

export interface UpdateExpenseDto {
  amount?: number;
  description?: string;
  date?: string;
  categoryId?: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceFrequency?: RecurrenceFrequency;
  nextOccurrence?: string;
}

export interface ExpensesFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const expensesService = {
  async getAll(filters?: ExpensesFilters): Promise<Expense[] | PaginatedResponse<Expense>> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/expenses?${params.toString()}`);
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

  async generateRecurring(): Promise<{ created: number; expenses: Expense[] }> {
    const response = await api.post<{ created: number; expenses: Expense[] }>('/expenses/generate-recurring');
    return response.data;
  },

  async bulkImport(rows: CreateExpenseDto[]): Promise<{ imported: number; errors: string[] }> {
    const response = await api.post<{ imported: number; errors: string[] }>('/expenses/bulk-import', { rows });
    return response.data;
  },
};
