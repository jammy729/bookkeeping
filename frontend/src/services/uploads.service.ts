import { api } from '../lib/api';

export interface Attachment {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  description?: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
}

export const uploadsService = {
  async upload(file: File, entityType = 'receipt', entityId?: string): Promise<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({ entityType });
    if (entityId) params.append('entityId', entityId);

    const response = await api.post<Attachment>(`/uploads?${params.toString()}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async list(entityType?: string, entityId?: string): Promise<Attachment[]> {
    const params = new URLSearchParams();
    if (entityType) params.append('entityType', entityType);
    if (entityId) params.append('entityId', entityId);

    const response = await api.get<Attachment[]>(`/uploads?${params.toString()}`);
    return response.data;
  },

  async getOne(id: string): Promise<Attachment> {
    const response = await api.get<Attachment>(`/uploads/${id}`);
    return response.data;
  },

  async getUrl(id: string): Promise<string> {
    const response = await api.get<{ url: string }>(`/uploads/${id}/url`);
    return response.data.url;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/uploads/${id}`);
  },

  async link(id: string, entityType: string, entityId: string): Promise<Attachment> {
    const response = await api.put<Attachment>(`/uploads/${id}/link`, { entityType, entityId });
    return response.data;
  },

  async unlink(id: string): Promise<Attachment> {
    const response = await api.put<Attachment>(`/uploads/${id}/unlink`);
    return response.data;
  },
};
