import { api } from '../lib/api';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  description: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  type: 'expense' | 'income';
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  type?: 'expense' | 'income';
  description?: string;
  isActive?: boolean;
}

export const categoriesService = {
  async getAll(type?: 'expense' | 'income'): Promise<Category[]> {
    const params = type ? `?type=${type}` : '';
    const response = await api.get<Category[]>(`/categories${params}`);
    return response.data;
  },

  async getExpenseCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories/expenses');
    return response.data;
  },

  async getIncomeCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories/incomes');
    return response.data;
  },

  async getById(id: string): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await api.post<Category>('/categories', data);
    return response.data;
  },

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await api.put<Category>(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
