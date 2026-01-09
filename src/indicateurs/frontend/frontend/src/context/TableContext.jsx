import { createContext, useContext, useState, useEffect } from "react";
import { getColumnsForTables } from "../../../api/metadataApi";

// Context qui va propager tables sélectionnées et colonnes disponibles
const TableContext = createContext({
  selectedTables: [],   // tables cochées dans ce TableEditor
  parent: null,         // contexte parent
  availableColumns: [], // colonnes disponibles
  loading: false,
  error: null
});

// Hook pratique
export function useTableContext() {
  return useContext(TableContext);
}

// Provider pour chaque TableSelectionEditor
export function TableProvider({ value, parentContext, children }) {
  const tables = value?.tables || [];

  const effectiveTables = tables.length > 0 ? tables : parentContext?.effectiveTables || [];

  const [availableColumns, setAvailableColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadColumns() {
      if (effectiveTables.length === 0) {
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
  }, [effectiveTables.join(",")]);

  const contextValue = {
    selectedTables: tables,
    parent: parentContext,
    availableColumns,
    effectiveTables,
    loading,
    error
  };

  return (
    <TableContext.Provider value={contextValue}>
      {children}
    </TableContext.Provider>
  );
}
