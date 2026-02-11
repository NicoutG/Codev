import React, { useState, useEffect, useMemo } from "react";
import { useTableContext } from "../../contexts/TableContext";
import { useSubject } from "../../contexts/SubjectContext";
import { metadataApi } from "../../api/metadata";

export default function ColumnEditor({ value, onChange }) {
  const ctx = useTableContext();
  const { sujet } = useSubject();

  const [columns, setColumns] = useState([]);

  // Tables prioritaires : TableContext > subject global
  const tablesToLoad = useMemo(() => {
    if (ctx?.effectiveTables?.length > 0) return ctx.effectiveTables;
    return sujet?.tables || [];
  }, [ctx?.effectiveTables, sujet?.tables]);

  // Clé stable pour déclencher le useEffect
  const tablesKey = useMemo(() => {
    if (!tablesToLoad || tablesToLoad.length === 0) return "";
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
        if (!cancelled) {
          const normalized = Array.isArray(cols)
            ? cols.map((c) => String(c))
            : [];
          setColumns(normalized);

          // Si value.col vide, on définit automatiquement le premier de la liste
          if ((!value || !value.col) && normalized.length > 0) {
            onChange({ ...(value || {}), col: normalized[0] });
          }
        }
      } catch {
        if (!cancelled) setColumns([]);
      }
    }

    loadColumns();

    return () => {
      cancelled = true;
    };
  }, [tablesKey]); // dépend uniquement de la clé stable

  // Tri non destructif
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => a.localeCompare(b));
  }, [columns]);

  return (
    <select
      value={value?.col || ""}
      onChange={(e) => onChange({ ...(value || {}), col: e.target.value })}
    >
      <option value="" disabled>
        -- choisir une colonne --
      </option>

      {sortedColumns.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
