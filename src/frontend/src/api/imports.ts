import { apiClient } from './client';

export interface ImportResponse {
  status: string;
  table: string;
  delimiter: string;
  processed_rows: number;
  upserted_rows: number;
  ignored_columns: string[];
}

export const importsApi = {
  async importCsv(table: string, file: File): Promise<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ImportResponse>(
      `/api/v1/imports/csv?table=${encodeURIComponent(table)}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
};
