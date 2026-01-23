import { fetchJson } from "./authApi";

// =======================
// Cache mémoire (module)
// =======================

let tablesCache = null;
let tablesPromise = null;

const columnsByTableCache = new Map();
const columnsByTablePromise = new Map();

const columnsForTablesCache = new Map();
const columnsForTablesPromise = new Map();

// =======================
// API publiques
// =======================

export async function getTables() {
  if (tablesCache) {
    return tablesCache;
  }

  if (tablesPromise) {
    return tablesPromise;
  }

  tablesPromise = fetchJson("/api/metadata/tables")
    .then(data => {
      // Handle both old format (array of strings) and new format (array of objects)
      if (data && data.length > 0 && typeof data[0] === 'string') {
        // Old format: convert to new format
        tablesCache = data.map(name => ({ name, row_count: 0, columns: [] }));
      } else {
        // New format: already objects
        tablesCache = data;
      }
      return tablesCache;
    })
    .finally(() => {
      tablesPromise = null;
    });

  return tablesPromise;
}

export async function getColumns(table) {
  if (columnsByTableCache.has(table)) {
    return columnsByTableCache.get(table);
  }

  if (columnsByTablePromise.has(table)) {
    return columnsByTablePromise.get(table);
  }

  const promise = fetchJson(
    `/api/metadata/tables/${table}/columns`
  )
    .then(data => {
      columnsByTableCache.set(table, data);
      return data;
    })
    .finally(() => {
      columnsByTablePromise.delete(table);
    });

  columnsByTablePromise.set(table, promise);
  return promise;
}

export async function getColumnsForTables(tables) {
  // clé stable : ordre + unicité
  const key = [...new Set(tables)].sort().join(",");

  if (columnsForTablesCache.has(key)) {
    return columnsForTablesCache.get(key);
  }

  if (columnsForTablesPromise.has(key)) {
    return columnsForTablesPromise.get(key);
  }

  const promise = fetchJson("/api/metadata/columns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tables }) // <== OK avec Pydantic
  })
    .then(data => {
      columnsForTablesCache.set(key, data);
      return data;
    })
    .finally(() => {
      columnsForTablesPromise.delete(key);
    });

  columnsForTablesPromise.set(key, promise);
  return promise;
}

// =======================
// Invalidation (optionnelle)
// =======================

export function clearMetadataCache() {
  tablesCache = null;
  columnsByTableCache.clear();
  columnsForTablesCache.clear();
}
