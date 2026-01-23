import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SubjectProvider } from "../components/context/SubjectContext";
import SubjectBlock from "../components/blocks/SubjectBlock";
import ColumnBlock from "../components/blocks/ColumnBlock";
import { createIndicator, calculateIndicator } from "../api/indicatorApi";
import { getTableData } from "../api/dataApi";
import { getTables } from "../api/metadataApi";

function emptyIndicator() {
  return {
    title: "",
    description: "",
    sujet: { tables: [], conditions: null },
    colonnes: []
  };
}

export default function IndicatorCreate() {
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState(emptyIndicator());
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const fileInputRef = useRef(null);
  
  // Aperçu en temps réel
  const [tablePreview, setTablePreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [resultsPreview, setResultsPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  // Charger l'aperçu des données quand une table est sélectionnée
  useEffect(() => {
    if (indicator.sujet.tables.length > 0) {
      loadTablePreview(indicator.sujet.tables[0]);
    } else {
      setTablePreview(null);
      setResultsPreview(null);
    }
  }, [indicator.sujet.tables]);

  // Prévisualiser les résultats quand l'indicateur change
  useEffect(() => {
    if (indicator.sujet.tables.length > 0 && indicator.colonnes.length > 0) {
      // Vérifier que toutes les colonnes sont configurées
      const allConfigured = indicator.colonnes.every(col => {
        if (col.type === "group_by") return col.expr?.col;
        if (col.type === "case") return col.cases && col.cases.length > 0;
        if (col.type === "aggregation") return col.expr;
        return false;
      });
      
      if (allConfigured) {
        previewResults();
      } else {
        setResultsPreview(null);
        setPreviewError(null);
      }
    } else {
      setResultsPreview(null);
      setPreviewError(null);
    }
  }, [indicator.sujet, indicator.colonnes]);

  async function loadTablePreview(tableName) {
    setPreviewLoading(true);
    try {
      const data = await getTableData(tableName, null, 10, 0);
      setTablePreview({
        tableName,
        columns: data.data.length > 0 ? Object.keys(data.data[0]) : [],
        rows: data.data,
        total: data.total
      });
    } catch (err) {
      console.error("Erreur chargement aperçu:", err);
      setTablePreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  async function previewResults() {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      // Créer un indicateur temporaire pour le calcul
      const spec = {
        sujet: indicator.sujet,
        colonnes: indicator.colonnes
      };
      
      // Utiliser l'API de calcul directement
      const response = await fetch("/api/indicators/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ spec_json: spec })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Erreur de calcul");
      }
      
      const results = await response.json();
      setResultsPreview(results);
    } catch (err) {
      console.error("Erreur prévisualisation:", err);
      setPreviewError(err.message || "Impossible de prévisualiser les résultats");
      setResultsPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function addColumn() {
    if (indicator.sujet.tables.length === 0) {
      alert("Veuillez sélectionner au moins une table pour ajouter une colonne.");
      return;
    }
    setIndicator({
      ...indicator,
      colonnes: [
        ...indicator.colonnes,
        { type: "group_by", titre: "Nouvelle colonne", expr: { col: "" } }
      ]
    });
  }

  function updateColumn(index, newCol) {
    const cols = [...indicator.colonnes];
    cols[index] = newCol;
    setIndicator({ ...indicator, colonnes: cols });
  }

  function deleteColumn(index) {
    setIndicator({
      ...indicator,
      colonnes: indicator.colonnes.filter((_, i) => i !== index)
    });
  }

  const exportJson = {
    sujet: indicator.sujet,
    colonnes: indicator.colonnes
  };

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target.result);
        setIndicator({
          ...emptyIndicator(),
          title: json.title || "Indicateur importé",
          description: json.description || "",
          sujet: json.sujet ?? { tables: [], conditions: null },
          colonnes: json.colonnes ?? []
        });
      } catch {
        alert("Fichier JSON invalide");
      }
    };
    reader.readAsText(file);
  }

  function exportToFile() {
    if (!indicator.title) {
      alert("Le titre est requis pour exporter le fichier");
      return;
    }
    const blob = new Blob([JSON.stringify(exportJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${indicator.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (!indicator.title || indicator.title.trim() === "") {
      alert("Le titre est requis");
      return;
    }
    if (indicator.sujet.tables.length === 0) {
      alert("Veuillez sélectionner au moins une table dans le Sujet");
      return;
    }
    if (indicator.colonnes.length === 0) {
      alert("Veuillez ajouter au moins une colonne");
      return;
    }

    setSaving(true);
    try {
      await createIndicator({
        title: indicator.title,
        description: indicator.description,
        spec_json: exportJson
      });
      navigate("/indicators");
    } catch (err) {
      alert("Erreur lors de la création: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SubjectProvider sujet={indicator.sujet} setSujet={sujet => setIndicator({ ...indicator, sujet })}>
      <div style={{ padding: 20, maxWidth: 1600, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h1>Créer un indicateur</h1>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => setShowHelp(!showHelp)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#17a2b8",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              {showHelp ? "❌ Masquer l'aide" : "❓ Aide"}
            </button>
            <button
              onClick={() => navigate("/indicators")}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              ← Retour
            </button>
          </div>
        </div>

        {/* Aide */}
        {showHelp && (
          <div style={{
            backgroundColor: "#e7f3ff",
            border: "1px solid #b3d9ff",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "30px"
          }}>
            <h3 style={{ marginTop: 0 }}>📚 Guide rapide</h3>
            <p><strong>1. Sélectionnez une table</strong> → Vous verrez un aperçu des données à droite</p>
            <p><strong>2. Ajoutez des colonnes</strong> → Les résultats se calculent automatiquement</p>
            <p><strong>3. Ajustez si besoin</strong> → L'aperçu se met à jour en temps réel</p>
          </div>
        )}

        {/* Layout en 2 colonnes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          {/* Colonne gauche : Configuration */}
          <div>
            {/* Métadonnées */}
            <div style={{ marginBottom: 20, backgroundColor: "white", padding: 15, borderRadius: 8, border: "1px solid #ddd" }}>
              <label style={{ display: "block", marginBottom: 5, fontWeight: "bold" }}>
                Titre de l'indicateur *
              </label>
              <input
                value={indicator.title}
                onChange={e => setIndicator({ ...indicator, title: e.target.value })}
                placeholder="Ex: Nombre de diplômés employés"
                style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4 }}
              />

              <label style={{ display: "block", marginTop: 10, marginBottom: 5, fontWeight: "bold" }}>
                Description (optionnelle)
              </label>
              <textarea
                value={indicator.description}
                onChange={e => setIndicator({ ...indicator, description: e.target.value })}
                placeholder="Description de l'indicateur..."
                style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4, minHeight: 60 }}
              />
            </div>

            {/* Sujet */}
            <div style={{
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px"
            }}>
              <h2 style={{ marginTop: 0, fontSize: 18 }}>
                📊 Étape 1 : Sélectionner une table
              </h2>
              {indicator.sujet.tables.length > 0 && (
                <div style={{
                  padding: "10px",
                  backgroundColor: "#d4edda",
                  border: "1px solid #c3e6cb",
                  borderRadius: "4px",
                  marginBottom: "15px"
                }}>
                  <strong>✅ Table sélectionnée :</strong> {indicator.sujet.tables[0]}
                </div>
              )}
              <SubjectBlock
                value={indicator.sujet}
                onChange={sujet => setIndicator({ ...indicator, sujet })}
              />
            </div>

            {/* Colonnes */}
            <div style={{
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 15 }}>
                <h2 style={{ marginTop: 0, fontSize: 18 }}>
                  📈 Étape 2 : Définir les colonnes
                </h2>
                <button
                  onClick={addColumn}
                  disabled={indicator.sujet.tables.length === 0}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: indicator.sujet.tables.length === 0 ? "#ccc" : "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: indicator.sujet.tables.length === 0 ? "not-allowed" : "pointer",
                    fontWeight: "bold"
                  }}
                >
                  + Ajouter
                </button>
              </div>
              
              {indicator.sujet.tables.length === 0 ? (
                <div style={{
                  padding: "20px",
                  backgroundColor: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "4px",
                  color: "#856404"
                }}>
                  ⚠️ Sélectionnez d'abord une table dans l'étape 1
                </div>
              ) : indicator.colonnes.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "40px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  color: "#666"
                }}>
                  <p>Aucune colonne définie. Cliquez sur "Ajouter" pour commencer.</p>
                </div>
              ) : (
                indicator.colonnes.map((col, i) => (
                  <div key={i} style={{ marginBottom: 15 }}>
                    <ColumnBlock
                      value={col}
                      onChange={newCol => updateColumn(i, newCol)}
                      onDelete={() => deleteColumn(i)}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div style={{
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              display: "flex",
              gap: "10px",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={() => navigate("/indicators")}
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "12px 24px",
                  backgroundColor: saving ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontWeight: "bold"
                }}
              >
                {saving ? "⏳ Création..." : "✅ Créer l'indicateur"}
              </button>
            </div>
          </div>

          {/* Colonne droite : Aperçu en temps réel */}
          <div>
            <div style={{
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
              position: "sticky",
              top: 20
            }}>
              <h2 style={{ marginTop: 0, fontSize: 18, marginBottom: 15 }}>
                👁️ Aperçu en temps réel
              </h2>

              {/* Aperçu des données brutes */}
              {indicator.sujet.tables.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>
                    📋 Données de la table "{indicator.sujet.tables[0]}"
                  </h3>
                  {previewLoading && !tablePreview ? (
                    <div style={{ padding: 20, textAlign: "center", color: "#666" }}>
                      Chargement...
                    </div>
                  ) : tablePreview ? (
                    <div>
                      <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
                        {tablePreview.total.toLocaleString()} lignes au total • Aperçu de {tablePreview.rows.length} lignes
                      </div>
                      <div style={{ overflowX: "auto", maxHeight: 300, border: "1px solid #ddd", borderRadius: 4 }}>
                        <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                          <thead style={{ backgroundColor: "#f8f9fa", position: "sticky", top: 0 }}>
                            <tr>
                              {tablePreview.columns.slice(0, 8).map(col => (
                                <th key={col} style={{ padding: "6px", border: "1px solid #ddd", textAlign: "left", fontWeight: "bold" }}>
                                  {col.length > 20 ? col.substring(0, 20) + "..." : col}
                                </th>
                              ))}
                              {tablePreview.columns.length > 8 && (
                                <th style={{ padding: "6px", border: "1px solid #ddd", textAlign: "left", fontWeight: "bold" }}>
                                  ... +{tablePreview.columns.length - 8} autres
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {tablePreview.rows.slice(0, 5).map((row, idx) => (
                              <tr key={idx}>
                                {tablePreview.columns.slice(0, 8).map(col => (
                                  <td key={col} style={{ padding: "6px", border: "1px solid #ddd" }}>
                                    {row[col] !== null && row[col] !== undefined ? String(row[col]).substring(0, 30) : ""}
                                  </td>
                                ))}
                                {tablePreview.columns.length > 8 && <td style={{ padding: "6px", border: "1px solid #ddd" }}>...</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: 20, textAlign: "center", color: "#999" }}>
                      Impossible de charger l'aperçu
                    </div>
                  )}
                </div>
              )}

              {/* Aperçu des résultats calculés */}
              {indicator.colonnes.length > 0 && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #ddd" }}>
                  <h3 style={{ fontSize: 14, color: "#666", marginBottom: 10 }}>
                    📊 Résultats calculés
                  </h3>
                  {previewLoading && !resultsPreview && !previewError ? (
                    <div style={{ padding: 20, textAlign: "center", color: "#666" }}>
                      ⏳ Calcul en cours...
                    </div>
                  ) : previewError ? (
                    <div style={{
                      padding: 15,
                      backgroundColor: "#f8d7da",
                      border: "1px solid #f5c6cb",
                      borderRadius: 4,
                      color: "#721c24",
                      fontSize: 12
                    }}>
                      <strong>❌ Erreur :</strong> {previewError}
                    </div>
                  ) : resultsPreview && resultsPreview.length > 0 ? (
                    <div style={{ overflowX: "auto", border: "1px solid #ddd", borderRadius: 4 }}>
                      <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                        <thead style={{ backgroundColor: "#f8f9fa" }}>
                          <tr>
                            {Object.keys(resultsPreview[0]).map(key => (
                              <th key={key} style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left", fontWeight: "bold" }}>
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {resultsPreview.slice(0, 10).map((row, idx) => (
                            <tr key={idx}>
                              {Object.keys(resultsPreview[0]).map(key => (
                                <td key={key} style={{ padding: "8px", border: "1px solid #ddd" }}>
                                  {row[key] !== null && row[key] !== undefined ? String(row[key]) : ""}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {resultsPreview.length > 10 && (
                        <div style={{ padding: 10, textAlign: "center", fontSize: 11, color: "#666", backgroundColor: "#f8f9fa" }}>
                          ... et {resultsPreview.length - 10} autres lignes
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: 20, textAlign: "center", color: "#999", fontSize: 12 }}>
                      {indicator.colonnes.some(col => 
                        (col.type === "group_by" && !col.expr?.col) ||
                        (col.type === "case" && (!col.cases || col.cases.length === 0)) ||
                        (col.type === "aggregation" && !col.expr)
                      ) ? (
                        "⚠️ Complétez la configuration des colonnes pour voir les résultats"
                      ) : (
                        "Aucun résultat pour le moment"
                      )}
                    </div>
                  )}
                </div>
              )}

              {indicator.sujet.tables.length === 0 && indicator.colonnes.length === 0 && (
                <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
                  <p>👈 Configurez votre indicateur à gauche</p>
                  <p style={{ fontSize: 12, marginTop: 10 }}>
                    L'aperçu apparaîtra ici automatiquement
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Import/Export JSON - Masqué par défaut */}
        <details style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #ddd",
          borderRadius: "8px",
          padding: "15px",
          marginTop: "20px"
        }}>
          <summary style={{ cursor: "pointer", color: "#666", fontWeight: "bold", fontSize: "14px" }}>
            💾 Options avancées (Import/Export JSON)
          </summary>
          <div style={{ marginTop: "15px" }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: 15 }}>
              <button
                onClick={() => fileInputRef.current.click()}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#17a2b8",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "14px"
                }}
              >
                📥 Importer un JSON
              </button>
              <button
                onClick={exportToFile}
                disabled={!indicator.title}
                style={{
                  padding: "8px 16px",
                  backgroundColor: indicator.title ? "#28a745" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: indicator.title ? "pointer" : "not-allowed",
                  fontSize: "14px"
                }}
              >
                📤 Exporter le JSON
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={e => e.target.files[0] && importJson(e.target.files[0])}
            />
          </div>
        </details>
      </div>
    </SubjectProvider>
  );
}
