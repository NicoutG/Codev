import AggregationEditor from "./AggregationEditor";

const VALUE_TYPES = [
  { key: "number", label: "Nombre" },
  { key: "boolean", label: "Booléen" },
  { key: "string", label: "Texte" },
  { key: "column", label: "Colonne" },
  { key: "aggregation", label: "Agrégation" }
];

const COLUMNS = [
  "etudiant",
  "diplome",
  "diplomes",
  "age",
  "obtenu"
];

export default function ValueEditor({ value, onChange }) {
  /* ======================
     Détecter le type courant
     ====================== */
  const getType = () => {
    if (value?.agg) return "aggregation";
    if (value?.col) return "column";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "string") return "string";
    return "number";
  };

  const type = getType();

  /* ======================
     Changer de type
     ====================== */
  const changeType = t => {
    switch (t) {
      case "number":
        onChange(0);
        break;
      case "boolean":
        onChange(true);
        break;
      case "string":
        onChange("");
        break;
      case "column":
        onChange({ col: COLUMNS[0] });
        break;
      case "aggregation":
        onChange({
          agg: "count",
          subject: { tables: [] },
          condition: null
        });
        break;
      default:
        break;
    }
  };

  /* ======================
     Rendu valeur
     ====================== */
  const renderValue = () => {
    switch (type) {
      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={e => onChange(Number(e.target.value))}
          />
        );

      case "boolean":
        return (
          <select
            value={value ? "true" : "false"}
            onChange={e => onChange(e.target.value === "true")}
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        );

      case "string":
        return (
          <input
            type="text"
            placeholder="texte"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        );

      case "column":
        return (
          <select
            value={value.col}
            onChange={e => onChange({ col: e.target.value })}
          >
            {COLUMNS.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        );

      case "aggregation":
        return (
          <AggregationEditor
            value={value}
            onChange={onChange}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <select value={type} onChange={e => changeType(e.target.value)}>
        {VALUE_TYPES.map(t => (
          <option key={t.key} value={t.key}>
            {t.label}
          </option>
        ))}
      </select>

      {renderValue()}
    </div>
  );
}
