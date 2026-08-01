import { api } from '../lib/api';

export interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceDto {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  issueDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  taxRate?: number;
  discountAmount?: number;
}

export interface UpdateInvoiceDto {
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientAddress?: string;
  items?: { description: string; quantity: number; unitPrice: number }[];
  issueDate?: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  status?: InvoiceStatus;
  taxRate?: number;
  discountAmount?: number;
}

export interface InvoiceSummary {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueAmount: number;
}

export const invoicesService = {
  async getAll(status?: string): Promise<Invoice[]> {
    const params = status ? `?status=${status}` : '';
    const response = await api.get<Invoice[]>(`/invoices${params}`);
    return response.data;
  },

  async getById(id: string): Promise<Invoice> {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  async getSummary(): Promise<InvoiceSummary> {
    const response = await api.get<InvoiceSummary>('/invoices/summary');
    return response.data;
  },

  async create(data: CreateInvoiceDto): Promise<Invoice> {
    const response = await api.post<Invoice>('/invoices', data);
    return response.data;
  },

  async update(id: string, data: UpdateInvoiceDto): Promise<Invoice> {
    const response = await api.patch<Invoice>(`/invoices/${id}`, data);
    return response.data;
  },

  async markAsSent(id: string): Promise<Invoice> {
    const response = await api.post<Invoice>(`/invoices/${id}/send`);
    return response.data;
  },

  async markAsPaid(id: string): Promise<Invoice> {
    const response = await api.post<Invoice>(`/invoices/${id}/paid`);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/invoices/${id}`);
  },
};
