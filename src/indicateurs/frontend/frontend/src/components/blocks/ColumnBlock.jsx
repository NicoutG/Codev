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
        expr: { agg: "count" }
      });
    }
  }

  return (
    <Block title={value.titre} onDelete={onDelete}>
      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
          Titre de la colonne
        </label>
        <input
          value={value.titre}
          onChange={e =>
            onChange({ ...value, titre: e.target.value })
          }
          placeholder="Ex: Nombre d'étudiants"
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        />
      </div>

      <div>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
          Type de colonne
        </label>
        <select
          value={value.type}
          onChange={e => changeType(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            backgroundColor: "white"
          }}
        >
          <option value="group_by">📊 Regroupement par colonne (groupe les résultats par une colonne)</option>
          <option value="case">🏷️ Regroupement par cas (crée des catégories personnalisées)</option>
          <option value="aggregation">🔢 Valeur (calcule COUNT, SUM, pourcentage, etc.)</option>
        </select>
      </div>

      {value.type === "group_by" && (
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
            Colonne pour le regroupement
          </label>
          <ColumnEditor
            value={value.expr}
            onChange={expr => onChange({ ...value, expr })}
          />
        </div>
      )}

      {value.type === "case" && (
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
            Définir les cas
          </label>
          <CaseEditor
            value={value.cases}
            onChange={cases => onChange({ ...value, cases })}
          />
        </div>
      )}

      {value.type === "aggregation" && (
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "14px" }}>
            Expression de calcul
          </label>
          <ExpressionEditor
            value={value.expr}
            onChange={expr => onChange({ ...value, expr })}
          />
        </div>
      )}
    </Block>
  );
}
