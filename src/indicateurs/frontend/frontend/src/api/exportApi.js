import { getToken } from "./authApi";

const API_BASE = "";

export async function exportIndicatorExcel(indicatorId, templateType = "default") {
  const token = getToken();
  const res = await fetch(
    `${API_BASE}/api/export/excel?indicator_id=${indicatorId}&template_type=${templateType}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
  
  if (!res.ok) {
    throw new Error("Export failed");
  }
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `indicator_${indicatorId}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function exportFormulaire(formulaireId, periode = null, filters = null, templateType = "CTI") {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/formulaires/${formulaireId}/export`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ periode, filters }),
  });
  
  if (!res.ok) {
    throw new Error("Export failed");
  }
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `formulaire_${formulaireId}.xlsx`;
  a.click();
  window.URL.revokeObjectURL(url);
}
