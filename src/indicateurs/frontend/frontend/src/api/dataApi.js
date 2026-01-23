import { fetchJson } from "./authApi";

export async function getDataTables() {
  return fetchJson("/api/data/tables");
}

export async function getTableData(tableName, year = null, limit = 100, offset = 0) {
  const params = new URLSearchParams({ limit: limit.toString(), offset: offset.toString() });
  if (year) params.append("year", year.toString());
  return fetchJson(`/api/data/tables/${tableName}?${params}`);
}

export async function getTableYears(tableName) {
  return fetchJson(`/api/data/tables/${tableName}/years`);
}

export async function updateTableRow(tableName, rowId, data) {
  return fetchJson(`/api/data/tables/${tableName}/rows/${rowId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTableRow(tableName, rowId) {
  return fetchJson(`/api/data/tables/${tableName}/rows/${rowId}`, {
    method: "DELETE",
  });
}

export async function deleteImport(importId) {
  return fetchJson(`/api/import/${importId}`, {
    method: "DELETE",
  });
}
