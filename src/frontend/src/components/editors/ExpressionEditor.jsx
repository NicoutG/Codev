import ValueEditor from "./ValueEditor";

const OPS = ["+", "-", "*", "/"];

export default function ExpressionEditor({ value, onChange }) {
  /* ======================
     Ajouter une expression
     ====================== */
  const wrapWithOp = () => {
    onChange({
      op: "+",
      args: [value ?? 0, 0]
    });
  };

  /* ======================
     Expression composée
     ====================== */
  if (value?.op) {
    const [left, right] = value.args;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ExpressionEditor
          value={left}
          onChange={l =>
            onChange({ ...value, args: [l, right] })
          }
        />

        <select
          value={value.op}
          onChange={e =>
            onChange({ ...value, op: e.target.value })
          }
        >
          {OPS.map(o => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>

        <ExpressionEditor
          value={right}
          onChange={r =>
            onChange({ ...value, args: [left, r] })
          }
        />

        {/* supprimer l'expression */}
        <button onClick={() => onChange(left)}>✕</button>

        {/* étendre */}
        <button onClick={wrapWithOp}>+ Expression</button>
      </div>
    );
  }

  /* ======================
     Expression atomique
     ====================== */
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <ValueEditor value={value} onChange={onChange} />
      <button onClick={wrapWithOp}>+ Expression</button>
    </div>
  );
}
