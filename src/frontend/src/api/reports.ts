import { apiClient } from './client';

export interface ReportIndicatorConfig {
  indicator_id: number;
  chart_type?: string | null;
  chart_config?: any;
  display_order: number;
}

export interface Report {
  id: number;
  title: string;
  description?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  indicators: IndicatorInReport[];
}

export interface IndicatorInReport {
  id: number;
  title: string;
  description?: string;
  chart_type?: string | null;
  chart_config?: any;
  display_order: number;
}

export interface ReportCreate {
  title: string;
  description?: string;
  indicator_ids: number[];
  indicator_configs?: ReportIndicatorConfig[];
}

export interface ReportUpdate {
  title?: string;
  description?: string;
  indicator_ids?: number[];
  indicator_configs?: ReportIndicatorConfig[];
}

export interface ReportExecutionResult {
  indicator_id: number;
  indicator_title: string;
  chart_type?: string | null;
  execution_result: {
    sql: string;
    columns: string[];
    rows: any[];
    row_count: number;
    indicator_id: number;
    indicator_title: string;
    error?: string;
  };
}

export interface ReportGenerateResponse {
  report_id: number;
  report_title: string;
  generated_at: string;
  results: ReportExecutionResult[];
}

export const reportsApi = {
  async getAll(skip: number = 0, limit: number = 100): Promise<Report[]> {
    const response = await apiClient.get<Report[]>('/api/v1/reports/', {
      params: { skip, limit }
    });
    return response.data;
  },

  async getById(id: number): Promise<Report> {
    const response = await apiClient.get<Report>(`/api/v1/reports/${id}`);
    return response.data;
  },

  async create(data: ReportCreate): Promise<Report> {
    const response = await apiClient.post<Report>('/api/v1/reports/', data);
    return response.data;
  },

  async update(id: number, data: ReportUpdate): Promise<Report> {
    const response = await apiClient.put<Report>(`/api/v1/reports/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/reports/${id}`);
  },

  async generate(id: number): Promise<ReportGenerateResponse> {
    const response = await apiClient.post<ReportGenerateResponse>(`/api/v1/reports/${id}/generate`);
    return response.data;
  }
};
