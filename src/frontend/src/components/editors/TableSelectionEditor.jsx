import React, { useState, useEffect } from "react";
import { TableProvider } from "../../contexts/TableContext";
import ConditionEditor from "./ConditionEditor";
import { metadataApi } from "../../api/metadata";

export default function TableSelectionEditor({ value, onChange }) {
  const tables = value?.tables || [];
  const conditions = value?.conditions ?? null;

  const [availableTables, setAvailableTables] = useState([]);
  const [tableColumnsMap, setTableColumnsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Charger les tables et leurs colonnes
  useEffect(() => {
    let cancelled = false;

    async function loadTablesAndColumns() {
      setLoading(true);
      setError(null);
      try {
        const tables = await metadataApi.listTables();
        if (cancelled) return;
        setAvailableTables(tables);

        // Charger les colonnes de toutes les tables
        const colsMap = {};
        for (const t of tables) {
          const cols = await metadataApi.listColumnsForTables([t]);
          colsMap[t] = new Set(cols);
        }
        if (!cancelled) setTableColumnsMap(colsMap);
      } catch (e) {
        if (!cancelled) setError("Impossible de charger les tables");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTablesAndColumns();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTable = (table) => {
    const hasIdPolytech = tableColumnsMap[table]?.has("id_polytech") ?? false;

    if (!tables.includes(table)) {
      // On coche la table
      let nextTables;
      if (hasIdPolytech) {
        // Si la table contient id_polytech, garder seulement les tables qui contiennent id_polytech
        nextTables = [...tables.filter(t => tableColumnsMap[t]?.has("id_polytech")), table];
      } else {
        // Si la table ne contient pas id_polytech, décocher toutes les autres tables
        nextTables = [table];
      }
      onChange({ ...value, tables: nextTables });
    } else {
      // On décoche la table simplement
      onChange({ ...value, tables: tables.filter((t) => t !== table) });
    }
  };

  return (
    <TableProvider value={value}>
      <div style={{ border: "1px solid #ccc", padding: 6 }}>
        <strong>Tables</strong>
        {loading && <div>Chargement…</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}

        {!loading && !error && (
          <div style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
            {availableTables.map((t) => (
              <label key={t} style={{ display: "flex", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={tables.includes(t)}
                  onChange={() => toggleTable(t)}
                />
                {t}
              </label>
            ))}
          </div>
        )}

        <strong style={{ marginTop: 10, display: "block" }}>Conditions</strong>
        {conditions && (
          <button
            style={{ margin: "6px 0" }}
            onClick={() => onChange({ ...value, conditions: null })}
          >
            ✕ Supprimer les conditions
          </button>
        )}

        <ConditionEditor
          value={conditions}
          onChange={(cond) => onChange({ ...value, conditions: cond })}
        />
      </div>
    </TableProvider>
  );
}
