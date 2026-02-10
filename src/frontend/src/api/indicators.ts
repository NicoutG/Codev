import { apiClient } from './client';

export interface Indicator {
  id: number;
  title: string;
  description?: string;
  indicator: any; // JSON libre
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface IndicatorCreate {
  title: string;
  description?: string;
  indicator: any;
}

export interface IndicatorUpdate {
  title?: string;
  description?: string;
  indicator?: any;
}

export const indicatorsApi = {
  async getAll(skip: number = 0, limit: number = 100): Promise<Indicator[]> {
    const response = await apiClient.get<Indicator[]>('/api/v1/indicators/', {
      params: { skip, limit }
    });
    return response.data;
  },

  async getById(id: number): Promise<Indicator> {
    const response = await apiClient.get<Indicator>(`/api/v1/indicators/${id}`);
    return response.data;
  },

  async create(data: IndicatorCreate): Promise<Indicator> {
    const response = await apiClient.post<Indicator>('/api/v1/indicators/', data);
    return response.data;
  },

  async update(id: number, data: IndicatorUpdate): Promise<Indicator> {
    const response = await apiClient.put<Indicator>(`/api/v1/indicators/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/indicators/${id}`);
  },

  async execute(id: number): Promise<{
    sql: string;
    columns: string[];
    rows: any[];
    row_count: number;
    indicator_id: number;
    indicator_title: string;
  }> {
    const response = await apiClient.post(`/api/v1/indicators/${id}/execute`);
    return response.data;
  },

  async executeJson(indicatorJson: any): Promise<{
    sql: string;
    columns: string[];
    rows: any[];
    row_count: number;
    indicator_title: string;
  }> {
    const response = await apiClient.post('/api/v1/indicators/execute', indicatorJson);
    return response.data;
  }
};
