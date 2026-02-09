import { apiClient } from './client';

export interface TableDataRow {
  [key: string]: any;
}

export interface TableDataResponse {
  rows: TableDataRow[];
  total: number;
  columns: string[];
  page: number;
  limit: number;
  skip: number;
}

export interface TableDataParams {
  skip?: number;
  limit?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export const dataApi = {
  async getTableData(
    table: string,
    params: TableDataParams = {}
  ): Promise<TableDataResponse> {
    const response = await apiClient.get<TableDataResponse>(
      `/api/v1/data/${encodeURIComponent(table)}`,
      { params }
    );
    return response.data;
  }
};
