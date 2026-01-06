const COLUMNS = [
  "etudiant",
  "diplome",
  "diplomes",
  "age",
  "obtenu"
];

export default function ColumnEditor({ value, onChange }) {
  return (
    <select
      value={value.col}
      onChange={e => onChange({ col: e.target.value })}
    >
      {COLUMNS.map(c => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
