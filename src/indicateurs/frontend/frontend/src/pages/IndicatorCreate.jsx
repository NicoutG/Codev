import { useState, useRef } from "react";
import SubjectBlock from "../components/blocks/SubjectBlock";
import ColumnBlock from "../components/blocks/ColumnBlock";

function emptyIndicator() {
  return {
    title: "Nouvel indicateur",
    description: "",
    sujet: {
      tables: [],
      conditions: null
    },
    colonnes: []
  };
}

export default function IndicatorCreate() {
  const [indicator, setIndicator] = useState(emptyIndicator());
  const fileInputRef = useRef(null);

  /* ======================
     Colonnes
     ====================== */
  function addColumn() {
    setIndicator({
      ...indicator,
      colonnes: [
        ...indicator.colonnes,
        {
          type: "group_by",
          titre: "Nouvelle colonne",
          expr: { col: "" }
        }
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

  /* ======================
     JSON métier (export)
     ====================== */
  const exportJson = {
    sujet: indicator.sujet,
    colonnes: indicator.colonnes
  };

  /* ======================
     Import JSON
     ====================== */
  function importJson(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const json = JSON.parse(e.target.result);

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

  /* ======================
     Export JSON
     ====================== */
  function exportToFile() {
    if (!indicator.title) {
      alert("Le titre est requis pour exporter le fichier");
      return;
    }

    const blob = new Blob(
      [JSON.stringify(exportJson, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${indicator.title}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ padding: 20 }}>
      {/* ======================
          Actions hautes
         ====================== */}

      <h1>Créer un indicateur</h1>

      {/* ======================
          Métadonnées (UI seulement)
         ====================== */}
      <div style={{ marginBottom: 20 }}>
        <div>
          <strong>Titre de l’indicateur</strong>
          <input
            style={{ display: "block", width: "100%", marginTop: 4 }}
            value={indicator.title}
            onChange={e =>
              setIndicator({ ...indicator, title: e.target.value })
            }
          />
        </div>

        <div style={{ marginTop: 10 }}>
          <strong>Description (optionnelle)</strong>
          <textarea
            style={{ display: "block", width: "100%", marginTop: 4 }}
            value={indicator.description}
            onChange={e =>
              setIndicator({ ...indicator, description: e.target.value })
            }
          />
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => fileInputRef.current.click()}>
          Importer un JSON
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={e => e.target.files[0] && importJson(e.target.files[0])}
        />
      </div>

      {/* ======================
          Sujet
         ====================== */}
      <h2>Sujet</h2>

      <SubjectBlock
        value={indicator.sujet}
        onChange={sujet =>
          setIndicator({ ...indicator, sujet })
        }
      />

      {/* ======================
          Colonnes
         ====================== */}
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

      {/* ======================
          Export
         ====================== */}
      <div style={{ marginTop: 30 }}>
        <div style={{ marginBottom: 8 }}>
          <button onClick={exportToFile}>
            Exporter le JSON
          </button>
        </div>

        <pre>
          {JSON.stringify(exportJson, null, 2)}
        </pre>
      </div>
    </div>
  );
}
