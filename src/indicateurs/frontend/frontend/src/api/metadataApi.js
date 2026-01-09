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
// Helpers
// =======================

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type");

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (!contentType?.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Réponse non JSON reçue : ${text.substring(0, 100)}`
    );
  }

  return res.json();
}

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
      tablesCache = data;
      return data;
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
