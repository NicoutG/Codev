import Block from "./Block";
import ExpressionEditor from "../editors/ExpressionEditor";
import CaseEditor from "../editors/CaseEditor";
import ColumnEditor from "../editors/ColumnEditor";

export default function ColumnBlock({ value, onChange, onDelete }) {
  function changeType(type) {
    if (type === "group_by") {
      onChange({ type, titre: value.titre, expr: { col: "" } });
    }
    if (type === "case") {
      onChange({ type, titre: value.titre, cases: [] });
    }
    if (type === "aggregation") {
      onChange({
        type,
        titre: value.titre,
        expr: { agg: "count", conditions: null }
      });
    }
  }

  return (
    <Block title={value.titre} onDelete={onDelete}>
      <input
        value={value.titre}
        onChange={e =>
          onChange({ ...value, titre: e.target.value })
        }
      />

      <select
        value={value.type}
        onChange={e => changeType(e.target.value)}
      >
        <option value="group_by">Regroupement par colonne</option>
        <option value="case">Regroupement par cas</option>
        <option value="aggregation">Valeur</option>
      </select>

      {value.type === "group_by" && (
        <ColumnEditor
          value={value.expr}
          onChange={expr => onChange({ ...value, expr })}
        />
      )}

      {value.type === "case" && (
        <CaseEditor
          value={value.cases}
          onChange={cases => onChange({ ...value, cases })}
        />
      )}

      {value.type === "aggregation" && (
        <ExpressionEditor
          value={value.expr}
          onChange={expr => onChange({ ...value, expr })}
        />
      )}
    </Block>
  );
}
