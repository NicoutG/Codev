import Block from "./Block";
import AggregationEditor from "../editors/AggregationEditor";
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
        expr: { agg: "count" }
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
        <option value="group_by">Group by</option>
        <option value="case">Case</option>
        <option value="aggregation">Aggregation</option>
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
        <AggregationEditor
          value={value.expr}
          onChange={expr => onChange({ ...value, expr })}
        />
      )}
    </Block>
  );
}
