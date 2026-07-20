import { api } from '../lib/api';

export interface Income {
  id: string;
  amount: number;
  description: string;
  type: 'contractor_payment' | 'freelance' | 'consulting' | 'other';
  date: string;
  clientName: string | null;
  invoiceNumber: string | null;
  isPaid: boolean;
  paidDate: string | null;
  notes: string | null;
  hstAmount: number | null;
  includesHst: boolean;
  payPeriodWeeks: number | null;
  payPeriodCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeDto {
  amount: number;
  description: string;
  type: 'contractor_payment' | 'freelance' | 'consulting' | 'other';
  date: string;
  clientName?: string;
  invoiceNumber?: string;
  isPaid?: boolean;
  paidDate?: string;
  notes?: string;
  hstAmount?: number;
  includesHst?: boolean;
  payPeriodWeeks?: number;
  payPeriodCount?: number;
}

export interface UpdateIncomeDto {
  amount?: number;
  description?: string;
  type?: 'contractor_payment' | 'freelance' | 'consulting' | 'other';
  date?: string;
  clientName?: string;
  invoiceNumber?: string;
  isPaid?: boolean;
  paidDate?: string;
  notes?: string;
  hstAmount?: number;
  includesHst?: boolean;
  payPeriodWeeks?: number;
  payPeriodCount?: number;
}

export interface IncomeFilters {
  startDate?: string;
  endDate?: string;
  type?: string;
  isPaid?: boolean;
}

export const incomeService = {
  async getAll(filters?: IncomeFilters): Promise<Income[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.isPaid !== undefined) params.append('isPaid', String(filters.isPaid));
    
    const response = await api.get<Income[]>(`/income?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Income> {
    const response = await api.get<Income>(`/income/${id}`);
    return response.data;
  },

  async create(data: CreateIncomeDto): Promise<Income> {
    const response = await api.post<Income>('/income', data);
    return response.data;
  },

  async update(id: string, data: UpdateIncomeDto): Promise<Income> {
    const response = await api.put<Income>(`/income/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/income/${id}`);
  },

  async getTotal(startDate: string, endDate: string): Promise<number> {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<number>(`/income/summary/total?${params.toString()}`);
    return response.data;
  },

  async getByType(startDate: string, endDate: string): Promise<{ type: string; total: number }[]> {
    const params = new URLSearchParams({ startDate, endDate });
    const response = await api.get<{ type: string; total: number }[]>(`/income/summary/by-type?${params.toString()}`);
    return response.data;
  },
};
