export async function getTables() {
  const res = await fetch("/api/metadata/tables");
  return res.json();
}

export async function getColumns(table) {
  const res = await fetch(`/api/metadata/tables/${table}/columns`);
  return res.json();
}

export async function getColumnsForTables(tables) {
  const res = await fetch("/api/metadata/columns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tables)
  });
  return res.json();
}
