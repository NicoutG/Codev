import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SubjectProvider } from "../components/context/SubjectContext";
import SubjectBlock from "../components/blocks/SubjectBlock";
import ColumnBlock from "../components/blocks/ColumnBlock";
import { getIndicator, updateIndicator } from "../api/indicatorApi";

function emptyIndicator() {
  return {
    title: "Nouvel indicateur",
    description: "",
    sujet: { tables: [], conditions: null },
    colonnes: []
  };
}

export default function IndicatorEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState(emptyIndicator());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadIndicator();
  }, [id]);

  async function loadIndicator() {
    try {
      const data = await getIndicator(id);
      setIndicator({
        title: data.title,
        description: data.description || "",
        sujet: data.spec_json.sujet || { tables: [], conditions: null },
        colonnes: data.spec_json.colonnes || []
      });
    } catch (err) {
      alert("Erreur lors du chargement: " + err.message);
      navigate("/indicators");
    } finally {
      setLoading(false);
    }
  }

  // ======================
  // Colonnes
  // ======================
  function addColumn() {
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

  // ======================
  // Import / Export JSON
  // ======================
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
          ...indicator,
          sujet: json.sujet ?? { tables: [], conditions: null },
          colonnes: json.colonnes ?? []
        });
      } catch {
        alert("Fichier JSON invalide");
      }
    };
    reader.readAsText(file);
  }

  async function handleSave() {
    if (!indicator.title) {
      alert("Le titre est requis");
      return;
    }

    setSaving(true);
    try {
      await updateIndicator(id, {
        title: indicator.title,
        description: indicator.description,
        spec_json: exportJson
      });
      navigate("/indicators");
    } catch (err) {
      alert("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  return (
    <SubjectProvider sujet={indicator.sujet} setSujet={sujet => setIndicator({ ...indicator, sujet })}>
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h1>Éditer un indicateur</h1>
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

        {/* Métadonnées */}
        <div style={{ marginBottom: "20px" }}>
          <div>
            <strong>Titre de l'indicateur</strong>
            <input
              style={{ display: "block", width: "100%", marginTop: 4 }}
              value={indicator.title}
              onChange={e => setIndicator({ ...indicator, title: e.target.value })}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <strong>Description (optionnelle)</strong>
            <textarea
              style={{ display: "block", width: "100%", marginTop: 4 }}
              value={indicator.description}
              onChange={e => setIndicator({ ...indicator, description: e.target.value })}
            />
          </div>
        </div>

        {/* Import JSON */}
        <div style={{ marginBottom: 20 }}>
          <button onClick={() => fileInputRef.current.click()}>Importer un JSON</button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={e => e.target.files[0] && importJson(e.target.files[0])}
          />
        </div>

        {/* Sujet */}
        <h2>Sujet</h2>
        <SubjectBlock
          value={indicator.sujet}
          onChange={sujet => setIndicator({ ...indicator, sujet })}
        />

        {/* Colonnes */}
        <h2>Colonnes</h2>
        {indicator.colonnes.map((col, i) => (
          <ColumnBlock
            key={i}
            value={col}
            onChange={newCol => updateColumn(i, newCol)}
            onDelete={() => deleteColumn(i)}
          />
        ))}
        <button onClick={addColumn}>Ajouter une colonne</button>

        {/* Actions */}
        <div style={{ marginTop: 30, display: "flex", gap: "10px" }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "12px 24px",
              backgroundColor: saving ? "#ccc" : "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: saving ? "not-allowed" : "pointer"
            }}
          >
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </button>
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
        </div>

        {/* Export JSON */}
        <div style={{ marginTop: 30 }}>
          <div style={{ marginBottom: 8 }}>
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(exportJson, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${indicator.title}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>Exporter le JSON</button>
          </div>
          <pre>{JSON.stringify(exportJson, null, 2)}</pre>
        </div>
      </div>
    </SubjectProvider>
  );
}
