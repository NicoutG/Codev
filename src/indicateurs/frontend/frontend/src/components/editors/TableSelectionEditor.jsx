import ConditionEditor from "./ConditionEditor";

const AVAILABLE_TABLES = [
  "etudiant",
  "diplome",
  "diplomes",
  "inscription"
];

export default function TableSelectionEditor({ value, onChange }) {
  const tables = value?.tables || [];
  const condition = value?.condition || null;

  const toggleTable = table => {
    const nextTables = tables.includes(table)
      ? tables.filter(t => t !== table)
      : [...tables, table];

    onChange({
      ...value,
      tables: nextTables
    });
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 6 }}>
      <strong>Tables</strong>

      <div style={{ display: "flex", flexDirection: "column", marginTop: 4 }}>
        {AVAILABLE_TABLES.map(t => (
          <label key={t} style={{ display: "flex", gap: 4 }}>
            <input
              type="checkbox"
              checked={tables.includes(t)}
              onChange={() => toggleTable(t)}
            />
            {t}
          </label>
        ))}
      </div>

      <ConditionEditor
        value={condition}
        onChange={cond =>
          onChange({
            ...value,
            condition: cond
          })
        }
      />
    </div>
  );
}
