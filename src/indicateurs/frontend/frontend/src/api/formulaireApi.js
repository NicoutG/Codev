import { fetchJson } from "./authApi";

export async function getFormulaires() {
  return fetchJson("/api/formulaires");
}

export async function getFormulaire(id) {
  return fetchJson(`/api/formulaires/${id}`);
}

export async function createFormulaire(data) {
  return fetchJson("/api/formulaires", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function generateFormulaire(id, periode = null, filters = null) {
  return fetchJson(`/api/formulaires/${id}/generate`, {
    method: "POST",
    body: JSON.stringify({ periode, filters }),
  });
}

export async function getAvailableParams(id) {
  return fetchJson(`/api/formulaires/${id}/available-params`);
}
