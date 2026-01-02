import { useState } from "react";
import TableBlock from "../components/TableBlock";
import ConditionBlock from "../components/ConditionBlock";
import Block from "../components/Block"; // Pour colonnes

// Modèle minimal
function emptyIndicator() {
  return {
    sujet: {
      tables: [],
      conditions: []
    },
    colonnes: []
  };
}

// Section simple
function Section({ title, children }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 15, marginBottom: 20 }}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function IndicatorCreate() {
  const [indicator, setIndicator] = useState(emptyIndicator());

  // Colonnes
  function addColumn() {
    const newCol = { type: "aggregation", titre: "Nouvelle colonne", condition: [] };
    setIndicator({ ...indicator, colonnes: [...indicator.colonnes, newCol] });
  }

  function updateColumnCondition(index, newConds) {
    const cols = [...indicator.colonnes];
    cols[index].condition = newConds;
    setIndicator({ ...indicator, colonnes: cols });
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Créer un indicateur</h1>

      {/* Sujet */}
      <Section title="Sujet du tableau">
        <TableBlock
          tables={indicator.sujet.tables}
          setTables={tables =>
            setIndicator({ ...indicator, sujet: { ...indicator.sujet, tables } })
          }
        />
        <ConditionBlock
          conds={indicator.sujet.conditions}
          setConds={conds =>
            setIndicator({ ...indicator, sujet: { ...indicator.sujet, conditions: conds } })
          }
        />
      </Section>

      {/* Colonnes */}
      <Section title="Colonnes de valeurs">
        <button onClick={addColumn}>Ajouter une colonne</button>
        {indicator.colonnes.map((col, i) => (
          <Block key={i} title={col.titre}>
            <input
              type="text"
              value={col.titre}
              onChange={e => {
                const cols = [...indicator.colonnes];
                cols[i].titre = e.target.value;
                setIndicator({ ...indicator, colonnes: cols });
              }}
            />
            <ConditionBlock
              conds={col.condition || []}
              setConds={newConds => updateColumnCondition(i, newConds)}
            />
          </Block>
        ))}
      </Section>

      {/* Boutons export / SQL */}
      <div style={{ marginTop: 20 }}>
        <button onClick={() => console.log(JSON.stringify(indicator, null, 2))}>
          Export JSON
        </button>
        <button
          style={{ marginLeft: 10 }}
          onClick={() => alert("SQL pas encore branché")}
        >
          Voir SQL
        </button>
      </div>
    </div>
  );
}
