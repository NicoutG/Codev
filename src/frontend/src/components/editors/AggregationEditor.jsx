import TableSelectionEditor from "./TableSelectionEditor";
import ColumnEditor from "../editors/ColumnEditor";

export default function AggregationEditor({ value, onChange }) {
  function changeAgg(agg) {
    // si on repasse sur count, on supprime la colonne
    if (agg === "count") {
      const { col, ...rest } = value;
      onChange({ ...rest, agg });
    } else {
      onChange({ ...value, agg });
    }
  }

  const needsColumn = ["sum", "avg", "min", "max"].includes(value.agg);

  return (
    <div style={{ border: "1px dashed #aaa", padding: 5, borderRadius: 4 }}>
      <select
        value={value.agg}
        onChange={e => changeAgg(e.target.value)}
        style={{ marginBottom: 5 }}
      >
        <option value="count">count</option>
        <option value="sum">sum</option>
        <option value="avg">avg</option>
        <option value="min">min</option>
        <option value="max">max</option>
      </select>

      {needsColumn && (
        <ColumnEditor
          value={{ col: value.col || "" }}
          onChange={expr => onChange({ ...value, col: expr.col })}
        />
      )}

      <TableSelectionEditor
        value={value.subject || { tables: [], conditions: null }}
        onChange={subject => onChange({ ...value, subject })}
      />
    </div>
  );
}
