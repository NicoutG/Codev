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

  return (
    <div style={{ border: "1px dashed #aaa", padding: 5 }}>
      <select
        value={value.agg}
        onChange={e => changeAgg(e.target.value)}
      >
        <option value="count">count</option>
        <option value="sum">sum</option>
        <option value="avg">avg</option>
      </select>

      {(value.agg === "sum" || value.agg === "avg") && (
        <ColumnEditor
          value={{ col: value.col || "" }}
          onChange={expr =>
            onChange({ ...value, col: expr.col })
          }
        />
      )}

      <TableSelectionEditor
        value={value.subject || { tables: [], condition: null }}
        onChange={subject =>
          onChange({ ...value, subject })
        }
      />
    </div>
  );
}
