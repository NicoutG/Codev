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
    <select
      value={value.col || ""}
      onChange={e => onChange({ ...value, col: e.target.value })}
    >
      <option value="" disabled>-- choisir une colonne --</option>
      {columns.map(c => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  );
}
