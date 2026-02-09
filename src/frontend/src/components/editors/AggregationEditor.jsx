import TableSelectionEditor from "./TableSelectionEditor";

export default function AggregationEditor({ value, onChange }) {
  return (
    <div style={{ border: "1px dashed #aaa", padding: 5 }}>
      <select
        value={value.agg}
        onChange={e =>
          onChange({ ...value, agg: e.target.value })
        }
      >
        <option value="count">count</option>
        <option value="sum">sum</option>
        <option value="avg">avg</option>
      </select>

      <TableSelectionEditor
        value={value.subject || { tables: [], condition: null }}
        onChange={subject =>
          onChange({ ...value, subject })
        }
      />
    </div>
  );
}
