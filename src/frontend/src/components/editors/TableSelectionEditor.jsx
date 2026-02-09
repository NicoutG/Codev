import React, { useState, useEffect } from "react";
import { TableProvider } from "../../contexts/TableContext";
import ConditionEditor from "./ConditionEditor";
import { metadataApi } from "../../api/metadata";

export default function TableSelectionEditor({ value, onChange }) {
  const tables = value?.tables || [];
  const conditions = value?.conditions ?? null;

  const [availableTables, setAvailableTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadTables() {
      setLoading(true);
      setError(null);
      try {
        const data = await metadataApi.listTables();
        if (!cancelled) setAvailableTables(data);
      } catch (e) {
        if (!cancelled) setError("Impossible de charger les tables");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTables();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleTable = (table) => {
    const nextTables = tables.includes(table)
      ? tables.filter((t) => t !== table)
      : [...tables, table];
    onChange({ ...value, tables: nextTables });
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
