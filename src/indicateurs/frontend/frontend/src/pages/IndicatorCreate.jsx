import { useState } from "react";
import SubjectBlock from "../components/blocks/SubjectBlock";
import ColumnBlock from "../components/blocks/ColumnBlock";

function emptyIndicator() {
  return {
    sujet: {
      tables: [],
      conditions: null
    },
    colonnes: []
  };
}

export default function IndicatorCreate() {
  const [indicator, setIndicator] = useState(emptyIndicator());

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

  return (
    <div style={{ padding: 20 }}>
      <h1>Créer un indicateur</h1>

      <h2>Sujet</h2>
      
      <SubjectBlock
        value={indicator.sujet}
        onChange={sujet =>
          setIndicator({ ...indicator, sujet })
        }
      />

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

      <pre style={{ marginTop: 20 }}>
        {JSON.stringify(indicator, null, 2)}
      </pre>
    </div>
  );
}
