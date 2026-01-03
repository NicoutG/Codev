import ConditionEditor from "./ConditionEditor";

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

      <div>
        <strong>Tables</strong>
        <input
          placeholder="ex: diplome"
          value={(value.subject?.tables || []).join(",")}
          onChange={e =>
            onChange({
              ...value,
              subject: {
                ...(value.subject || {}),
                tables: e.target.value
                  .split(",")
                  .map(t => t.trim())
              }
            })
          }
        />
      </div>

      <ConditionEditor
        value={value.condition || null}
        onChange={cond =>
          onChange({ ...value, condition: cond })
        }
      />
    </div>
  );
}
