// src/api/metadata.ts
import { apiClient } from "./client";

export type TableName = string;
export type ColumnName = string;

export interface MetadataApi {
  listTables: () => Promise<TableName[]>;
  listColumns: (table: TableName) => Promise<ColumnName[]>;
  listColumnsForTables: (tables: TableName[]) => Promise<ColumnName[]>;
  clearCache: () => void;
}

let tablesCache: TableName[] | null = null;
let tablesPromise: Promise<TableName[]> | null = null;

const columnsByTableCache = new Map<TableName, ColumnName[]>();
const columnsByTablePromise = new Map<TableName, Promise<ColumnName[]>>();

const columnsForTablesCache = new Map<string, ColumnName[]>();
const columnsForTablesPromise = new Map<string, Promise<ColumnName[]>>();

function stableTablesKey(tables: TableName[]): string {
  return Array.from(new Set(tables)).sort().join(",");
}

async function fetchTables(): Promise<TableName[]> {
  const res = await apiClient.get<TableName[]>("/api/v1/metadata/tables");
  return res.data;
}

async function fetchColumns(table: TableName): Promise<ColumnName[]> {
  const res = await apiClient.get<ColumnName[]>(
    `/api/v1/metadata/tables/${encodeURIComponent(table)}/columns`
  );
  return res.data;
}

async function fetchColumnsForTables(tables: TableName[]): Promise<ColumnName[]> {
  // IMPORTANT: ton backend attend "List[str]" (liste directe), pas {tables: [...]}
  const res = await apiClient.post<ColumnName[]>(
    "/api/v1/metadata/columns",
    tables
  );
  return res.data;
}

export const metadataApi: MetadataApi = {
  async listTables() {
    if (tablesCache) return tablesCache;
    if (tablesPromise) return tablesPromise;

    tablesPromise = fetchTables()
      .then((data) => {
        tablesCache = data;
        return data;
      })
      .finally(() => {
        tablesPromise = null;
      });

    return tablesPromise;
  },

  async listColumns(table: TableName) {
    if (columnsByTableCache.has(table)) return columnsByTableCache.get(table)!;
    if (columnsByTablePromise.has(table)) return columnsByTablePromise.get(table)!;

    const p = fetchColumns(table)
      .then((data) => {
        columnsByTableCache.set(table, data);
        return data;
      })
      .finally(() => {
        columnsByTablePromise.delete(table);
      });

    columnsByTablePromise.set(table, p);
    return p;
  },

  async listColumnsForTables(tables: TableName[]) {
    const key = stableTablesKey(tables);

    if (columnsForTablesCache.has(key)) return columnsForTablesCache.get(key)!;
    if (columnsForTablesPromise.has(key)) return columnsForTablesPromise.get(key)!;

    const p = (async () => {
      // On récupère les colonnes de chaque table
      const allColumns = await Promise.all(
        tables.map(async (table) => {
          const cols = await this.listColumns(table);
          return cols.map((col) => ({ table, col }));
        })
      );

      const flatColumns = allColumns.flat();

      // Compter combien de fois chaque nom de colonne apparaît
      const colCount = new Map<string, number>();
      flatColumns.forEach(({ col }) => {
        colCount.set(col, (colCount.get(col) || 0) + 1);
      });

      // Préfixer par le nom de la table seulement si le nom existe dans plusieurs tables
      const result: ColumnName[] = flatColumns.map(({ table, col }) => {
        if (colCount.get(col)! > 1) {
          return `${table}.${col}`;
        }
        return col;
      });

      columnsForTablesCache.set(key, result);
      return result;
    })().finally(() => {
      columnsForTablesPromise.delete(key);
    });

    columnsForTablesPromise.set(key, p);
    return p;
  },

  clearCache() {
    tablesCache = null;
    tablesPromise = null;
    columnsByTableCache.clear();
    columnsByTablePromise.clear();
    columnsForTablesCache.clear();
    columnsForTablesPromise.clear();
  },
};
