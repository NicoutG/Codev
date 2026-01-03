import ExpressionEditor from "./ExpressionEditor";

const OPS = ["=", "!=", "<", "<=", ">", ">="];

export default function ConditionEditor({ value, onChange }) {
  /* ======================
     Pas encore de condition
     ====================== */
  if (!value) {
    return (
      <button
        onClick={() =>
          onChange({ "=": [{ col: "" }, 0] })
        }
      >
        + Condition
      </button>
    );
  }

  /* ======================
     AND / OR récursif
     ====================== */
  if (value.and || value.or) {
    const key = value.and ? "and" : "or";
    const items = value[key];

    return (
      <div
        style={{
          marginLeft: 12,
          paddingLeft: 8,
          borderLeft: "2px solid #ddd"
        }}
      >
        <select
          value={key}
          onChange={e =>
            onChange({ [e.target.value]: items })
          }
        >
          <option value="and">AND</option>
          <option value="or">OR</option>
        </select>

        {items.map((cond, i) => (
          <ConditionEditor
            key={i}
            value={cond}
            onChange={newCond => {
              const next = [...items];
              next[i] = newCond;
              onChange({ [key]: next });
            }}
          />
        ))}

        <button
          onClick={() =>
            onChange({
              [key]: [...items, { "=": [{ col: "" }, 0] }]
            })
          }
        >
          +
        </button>
      </div>
    );
  }

  /* ======================
     Comparaison simple
     ====================== */
  const op = Object.keys(value)[0];
  const [left, right] = value[op];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginTop: 6
      }}
    >
      {/* Expression gauche */}
      <ExpressionEditor
        value={left}
        onChange={l =>
          onChange({ [op]: [l, right] })
        }
      />

      {/* Opérateur */}
      <select
        value={op}
        onChange={e =>
          onChange({ [e.target.value]: [left, right] })
        }
      >
        {OPS.map(o => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {/* Expression droite */}
      <ExpressionEditor
        value={right}
        onChange={r =>
          onChange({ [op]: [left, r] })
        }
      />
    </div>
  );
}
