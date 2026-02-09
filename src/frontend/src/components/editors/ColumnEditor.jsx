import React, { useState, useEffect, useMemo } from "react";
import { useTableContext } from "../../contexts/TableContext";
import { useSubject } from "../../contexts/SubjectContext";
import { metadataApi } from "../../api/metadata";

export default function ColumnEditor({ value, onChange }) {
  const ctx = useTableContext();
  const { sujet } = useSubject();

  const [columns, setColumns] = useState([]);

  // Détermine les tables à utiliser : TableContext > subject global
  const tablesToLoad = useMemo(() => {
    if (ctx?.effectiveTables?.length > 0) return ctx.effectiveTables;
    return sujet?.tables || [];
  }, [ctx?.effectiveTables, sujet?.tables]);

  const tablesKey = useMemo(() => {
    if (!tablesToLoad || tablesToLoad.length === 0) return "";
    // key stable
    return Array.from(new Set(tablesToLoad)).sort().join(",");
  }, [tablesToLoad]);

  useEffect(() => {
    let cancelled = false;

    async function loadColumns() {
      if (!tablesToLoad || tablesToLoad.length === 0) {
        setColumns([]);
        return;
      }

      try {
        const cols = await metadataApi.listColumnsForTables(tablesToLoad);
        if (!cancelled) setColumns(cols);
      } catch {
        if (!cancelled) setColumns([]);
      }
    }

    loadColumns();
    return () => {
      cancelled = true;
    };
  }, [tablesKey]);

  return (
    <select
      value={value?.col || ""}
      onChange={(e) => onChange({ ...(value || {}), col: e.target.value })}
    >
      <option value="" disabled>
        -- choisir une colonne --
      </option>
      {columns.sort().map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
