import ExpressionEditor from "./ExpressionEditor";

const COMP_OPS = ["=", "!=", "<", "<=", ">", ">="];
const LOGICAL_OPS = ["and", "or"];

export default function ConditionEditor({ value, onChange }) {
  /* ======================
     Créer une nouvelle condition simple
     ====================== */
  const newCondition = () => ({
    "=": [null, null]
  });

  /* ======================
     Aucune condition existante
     ====================== */
  if (!value) {
    return (
      <button type="button" onClick={() => onChange(newCondition())}>
        + Condition
      </button>
    );
  }

  /* ======================
     Groupe AND / OR
     ====================== */
  if (value.and || value.or) {
    const key = value.and ? "and" : "or";
    const items = value[key];

    const updateItem = (i, cond) => {
      const next = [...items];
      next[i] = cond;
      onChange({ [key]: next });
    };

    const removeItem = i => {
      const next = items.filter((_, idx) => idx !== i);
      if (next.length === 1) {
        onChange(next[0]); // déplier si un seul restant
      } else {
        onChange({ [key]: next });
      }
    };

    const changeLogicalOp = newKey => {
      onChange({ [newKey]: items });
    };

    return (
      <div style={{ marginLeft: 12 }}>
        {items.map((cond, i) => (
          <div key={i}>
            {/* Condition individuelle */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ConditionEditor
                value={cond}
                onChange={c => updateItem(i, c)}
              />
              <button type="button" onClick={() => removeItem(i)}>✕</button>
            </div>

            {/* Opérateur logique entre conditions */}
            {i < items.length - 1 && (
              <select
                value={key}
                onChange={e => changeLogicalOp(e.target.value)}
                style={{ margin: "6px 0" }}
              >
                <option value="and">ET</option>
                <option value="or">OU</option>
              </select>
            )}
          </div>
        ))}

        <button
          type="button"
          style={{ marginTop: 6 }}
          onClick={() =>
            onChange({ [key]: [...items, newCondition()] })
          }
        >
          + Condition
        </button>
      </div>
    );
  }

  /* ======================
     Condition simple
     ====================== */
  const op = Object.keys(value)[0];
  const [left, right] = value[op];

  const wrapWithLogical = () => {
    onChange({
      and: [value, newCondition()]
    });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <ExpressionEditor
        value={left}
        onChange={l => onChange({ [op]: [l, right] })}
      />

      <select
        value={op}
        onChange={e => onChange({ [e.target.value]: [left, right] })}
      >
        {COMP_OPS.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>

      <ExpressionEditor
        value={right}
        onChange={r => onChange({ [op]: [left, r] })}
      />

      <button type="button" onClick={wrapWithLogical}>
        + Condition
      </button>
    </div>
  );
}
