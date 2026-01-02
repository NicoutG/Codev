import Block from "./Block";

export default function TableBlock({ tables, setTables }) {
  const availableTables = ["etudiant", "diplome"];
  function toggleTable(table) {
    const newTables = tables.includes(table)
      ? tables.filter(t => t !== table)
      : [...tables, table];
    setTables(newTables);
  }

  return (
    <Block title="Tables">
      {availableTables.map(t => (
        <label key={t} style={{ marginRight: 10 }}>
          <input
            type="checkbox"
            checked={tables.includes(t)}
            onChange={() => toggleTable(t)}
          />{" "}
          {t}
        </label>
      ))}
    </Block>
  );
}
