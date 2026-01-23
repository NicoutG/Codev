import { fetchJson, getToken } from "./authApi";

const API_BASE = "";

export async function importExcel(file, typeDonnee = null) {
  const formData = new FormData();
  formData.append("file", file);
  if (typeDonnee) {
    formData.append("type_donnee", typeDonnee);
  }
  
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/import/excel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Import failed");
  }
  
  return res.json();
}

export async function validateExcel(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/import/validate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  
  return res.json();
}

export async function getImportHistory() {
  return fetchJson("/api/import/history");
}
