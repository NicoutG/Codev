import AggregationEditor from "./AggregationEditor";

export default function ExpressionEditor({ value, onChange }) {
  if (value == null) {
    return <button onClick={() => onChange(0)}>+ Expression</button>;
  }

  // nombre
  if (typeof value === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    );
  }

  // bool
  if (typeof value === "boolean") {
    return (
      <select
        value={value ? "true" : "false"}
        onChange={e => onChange(e.target.value === "true")}
      >
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  // colonne
  if (value.col) {
    return (
      <input
        placeholder="colonne"
        value={value.col}
        onChange={e => onChange({ col: e.target.value })}
      />
    );
  }

  // opération
  if (value.op) {
    return (
      <div>
        <select
          value={value.op}
          onChange={e =>
            onChange({ ...value, op: e.target.value })
          }
        >
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">*</option>
          <option value="/">/</option>
        </select>

        {value.args.map((arg, i) => (
          <ExpressionEditor
            key={i}
            value={arg}
            onChange={newArg => {
              const args = [...value.args];
              args[i] = newArg;
              onChange({ ...value, args });
            }}
          />
        ))}

        <button
          onClick={() =>
            onChange({ ...value, args: [...value.args, 0] })
          }
        >
          +
        </button>
      </div>
    );
  }

  // aggregation
  if (value.agg) {
    return (
      <AggregationEditor
        value={value}
        onChange={onChange}
      />
    );
  }

  return null;
}
