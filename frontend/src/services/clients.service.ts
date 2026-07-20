import { api } from '../lib/api';

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export const clientsService = {
  async getAll(activeOnly?: boolean): Promise<Client[]> {
    const params = new URLSearchParams();
    if (activeOnly !== undefined) params.append('activeOnly', String(activeOnly));
    
    const response = await api.get<Client[]>(`/clients?${params.toString()}`);
    return response.data;
  },

  async getById(id: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  async create(data: CreateClientDto): Promise<Client> {
    const response = await api.post<Client>('/clients', data);
    return response.data;
  },

  async update(id: string, data: UpdateClientDto): Promise<Client> {
    const response = await api.put<Client>(`/clients/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};
