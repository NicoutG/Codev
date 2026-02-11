import React, { useState, useEffect } from "react";
import { TableProvider } from "../../contexts/TableContext";
import ConditionEditor from "./ConditionEditor";
import { metadataApi } from "../../api/metadata";

export default function TableSelectionEditor({ value, onChange, isSubjectSection = false }) {
  const tables = value?.tables || [];
  const conditions = value?.conditions ?? null;

  const [availableTables, setAvailableTables] = useState([]);
  const [tableColumnsMap, setTableColumnsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // état local pour le checkbox Sujet (affichage seulement)
  const [subjectChecked, setSubjectChecked] = useState(!isSubjectSection && tables.length === 0);

  // Charger les tables et leurs colonnes
  useEffect(() => {
    let cancelled = false;

    async function loadTablesAndColumns() {
      setLoading(true);
      setError(null);
      try {
        const tablesList = await metadataApi.listTables();
        if (cancelled) return;

        // Ajouter Sujet uniquement si on n'est pas dans la section sujet
        const allTables = isSubjectSection ? tablesList : tablesList;
        setAvailableTables(allTables);

        // Charger les colonnes de toutes les tables
        const colsMap = {};
        for (const t of tablesList) {
          const cols = await metadataApi.listColumnsForTables([t]);
          colsMap[t] = new Set(cols);
        }
        setTableColumnsMap(colsMap);
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
  }, [isSubjectSection]);

  const toggleTable = (table) => {
    const hasIdPolytech = tableColumnsMap[table]?.has("id_polytech") ?? false;

    if (!tables.includes(table)) {
      let nextTables;

      if (!isSubjectSection && table === "Sujet") {
        // coche Sujet → décocher toutes les autres tables (affichage)
        setSubjectChecked(true);
        nextTables = [];
      } else if (!isSubjectSection && subjectChecked) {
        // coche une table → décocher Sujet
        setSubjectChecked(false);
        nextTables = [table];
      } else if (hasIdPolytech) {
        nextTables = [...tables.filter((t) => tableColumnsMap[t]?.has("id_polytech")), table];
      } else {
        nextTables = [table];
      }

      onChange({ ...value, tables: nextTables });
    } else {
      // Décoche table
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
            {!isSubjectSection && (
              <label style={{ display: "flex", gap: 4 }}>
                <input
                  type="checkbox"
                  checked={subjectChecked}
                  onChange={() => toggleTable("Sujet")}
                />
                Sujet
              </label>
            )}

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
            type="button"
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
