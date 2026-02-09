import { apiClient } from './client';

export const exportsApi = {
  async exportCsv(table: string, delimiter: string = ';', includeBom: boolean = false): Promise<Blob> {
    const response = await apiClient.get(
      `/api/v1/exports/csv?table=${encodeURIComponent(table)}&delimiter=${encodeURIComponent(delimiter)}&bom=${includeBom}`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  async downloadCsv(table: string, delimiter: string = ';', includeBom: boolean = false): Promise<void> {
    const blob = await this.exportCsv(table, delimiter, includeBom);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
