import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getColumnsForTables } from "../../api/metadataApi";
import { useSubject } from "./SubjectContext";

const TableContext = createContext({
  selectedTables: [],
  availableColumns: [],
  effectiveTables: [],
  loading: false,
  error: null
});

export function useTableContext() {
  return useContext(TableContext);
}

export function TableProvider({ value, children }) {
  const { sujet } = useSubject(); // sujet global
  const tables = value?.tables || [];

  // recalculé à chaque rendu quand tables ou sujet.tables changent
  const effectiveTables = useMemo(() => {
    return tables.length > 0 ? tables : sujet?.tables || [];
  }, [tables, sujet?.tables]);

  const [availableColumns, setAvailableColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadColumns() {
      if (!effectiveTables || effectiveTables.length === 0) {
        setAvailableColumns([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const cols = await getColumnsForTables(effectiveTables);
        if (!cancelled) setAvailableColumns(cols);
      } catch (e) {
        if (!cancelled) setError("Impossible de charger les colonnes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadColumns();

    return () => { cancelled = true; };
  }, [effectiveTables.join(",")]); // dépend maintenant de effectiveTables recalculé

  return (
    <TableContext.Provider value={{
      selectedTables: tables,
      availableColumns,
      effectiveTables,
      loading,
      error
    }}>
      {children}
    </TableContext.Provider>
  );
}
