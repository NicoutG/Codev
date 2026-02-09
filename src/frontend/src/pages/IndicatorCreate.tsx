import React, { useState, useRef } from "react";
import { SubjectProvider } from "../contexts/SubjectContext";
import SubjectBlock from "../components/blocks/SubjectBlock";
import ColumnBlock from "../components/blocks/ColumnBlock";
import { Layout } from "../components/common/Layout";
import { ProtectedRoute } from "../components/common/ProtectedRoute";

function emptyIndicator() {
  return {
    title: "Nouvel indicateur",
    description: "",
    sujet: { tables: [], conditions: null },
    colonnes: []
  };
}

const IndicatorCreateContent: React.FC = () => {
  const [indicator, setIndicator] = useState(emptyIndicator());
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addColumn() {
    setIndicator({
      ...indicator,
      colonnes: [
        ...indicator.colonnes,
        { type: "group_by", titre: "Nouvelle colonne", expr: { col: "" } }
      ]
    });
  }

  function updateColumn(index: number, newCol: any) {
    const cols = [...indicator.colonnes];
    cols[index] = newCol;
    setIndicator({ ...indicator, colonnes: cols });
  }

  function deleteColumn(index: number) {
    setIndicator({
      ...indicator,
      colonnes: indicator.colonnes.filter((_, i) => i !== index)
    });
  }

  const exportJson = {
    sujet: indicator.sujet,
    colonnes: indicator.colonnes
  };

  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setIndicator({
          ...emptyIndicator(),
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

  return (
    <Layout>
      <SubjectProvider sujet={indicator.sujet} setSujet={(sujet) => setIndicator({ ...indicator, sujet })}>
        <div style={{ padding: 20 }}>
          <h1>Créer un indicateur</h1>

          <div style={{ marginBottom: 20 }}>
            <div>
              <strong>Titre de l'indicateur</strong>
              <input
                style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px" }}
                value={indicator.title}
                onChange={(e) => setIndicator({ ...indicator, title: e.target.value })}
              />
            </div>

            <div style={{ marginTop: 10 }}>
              <strong>Description (optionnelle)</strong>
              <textarea
                style={{ display: "block", width: "100%", marginTop: 4, padding: "0.5rem", border: "1px solid #d1d5db", borderRadius: "4px" }}
                value={indicator.description}
                onChange={(e) => setIndicator({ ...indicator, description: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <button onClick={() => fileInputRef.current?.click()} style={{ padding: "0.5rem 1rem", backgroundColor: "#1e3a8a", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Importer un JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
            />
          </div>

          <h2>Sujet</h2>
          <SubjectBlock
            value={indicator.sujet}
            onChange={(sujet) => setIndicator({ ...indicator, sujet })}
          />

          <h2>Colonnes</h2>
          {indicator.colonnes.map((col: any, i: number) => (
            <ColumnBlock
              key={i}
              value={col}
              onChange={(newCol) => updateColumn(i, newCol)}
              onDelete={() => deleteColumn(i)}
            />
          ))}
          <button onClick={addColumn} style={{ marginTop: "1rem", padding: "0.5rem 1rem", backgroundColor: "#10b981", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
            Ajouter une colonne
          </button>

          <div style={{ marginTop: 30 }}>
            <div style={{ marginBottom: 8 }}>
              <button onClick={exportToFile} style={{ padding: "0.5rem 1rem", backgroundColor: "#1e3a8a", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                Exporter le JSON
              </button>
            </div>
            <pre style={{ backgroundColor: "#f9fafb", padding: "1rem", borderRadius: "4px", overflow: "auto" }}>
              {JSON.stringify(exportJson, null, 2)}
            </pre>
          </div>
        </div>
      </SubjectProvider>
    </Layout>
  );
};

export default function IndicatorCreate() {
  return (
    <ProtectedRoute requiredRole="editeur">
      <IndicatorCreateContent />
    </ProtectedRoute>
  );
}
