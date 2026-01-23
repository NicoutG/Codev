import { fetchJson } from "./authApi";

export async function getIndicators() {
  return fetchJson("/api/indicators");
}

export async function getIndicator(id) {
  return fetchJson(`/api/indicators/${id}`);
}

export async function createIndicator(data) {
  return fetchJson("/api/indicators", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIndicator(id, data) {
  return fetchJson(`/api/indicators/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteIndicator(id) {
  return fetchJson(`/api/indicators/${id}`, {
    method: "DELETE",
  });
}

export async function calculateIndicator(id, periode = null, filters = null) {
  return fetchJson(`/api/indicators/${id}/calculate`, {
    method: "POST",
    body: JSON.stringify({ periode, filters }),
  });
}

export async function getIndicatorResults(id) {
  return fetchJson(`/api/indicators/${id}/results`);
}

export async function getSqlPreview(id) {
  return fetchJson(`/api/indicators/${id}/sql-preview`);
}

export async function getPredefinedIndicators() {
  return fetchJson("/api/indicators/templates/predefined");
}
