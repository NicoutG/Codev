import React, { useState, useEffect } from "react";
import { useTableContext } from "../context/TableContext";
import { useSubject } from "../context/SubjectContext";
import { getColumnsForTables } from "../../api/metadataApi";

export default function ColumnEditor({ value, onChange }) {
  const ctx = useTableContext();
  const { sujet } = useSubject();

  const [columns, setColumns] = useState([]);

  // Determine les tables à utiliser : TableContext > subject global
  const tablesToLoad = ctx?.effectiveTables?.length > 0
    ? ctx.effectiveTables
    : sujet?.tables || [];

  // Chargement des colonnes via API si besoin
  useEffect(() => {
    let cancelled = false;

    async function loadColumns() {
      if (!tablesToLoad || tablesToLoad.length === 0) {
        setColumns([]);
        return;
      }

      try {
        const cols = await getColumnsForTables(tablesToLoad);
        if (!cancelled) setColumns(cols);
      } catch {
        if (!cancelled) setColumns([]);
      }
    }

    loadColumns();
    return () => { cancelled = true; };
  }, [tablesToLoad.join(",")]);

  return (
    <div>
      {columns.length === 0 ? (
        <div style={{
          padding: "10px",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "4px",
          color: "#856404",
          fontSize: "14px"
        }}>
          ⚠️ Aucune colonne disponible. Assurez-vous d'avoir sélectionné une table dans l'étape 1.
        </div>
      ) : (
        <select
          value={value.col || ""}
          onChange={e => onChange({ ...value, col: e.target.value })}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            backgroundColor: "white"
          }}
        >
          <option value="" disabled>-- Choisir une colonne depuis votre table --</option>
          {columns.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      )}
      {columns.length > 0 && (
        <p style={{ fontSize: "12px", color: "#666", marginTop: "5px", marginBottom: 0 }}>
          {columns.length} colonne{columns.length > 1 ? "s" : ""} disponible{columns.length > 1 ? "s" : ""} depuis les tables sélectionnées
        </p>
      )}
    </div>
  );
}
