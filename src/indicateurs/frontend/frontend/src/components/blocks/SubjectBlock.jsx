import Block from "./Block";
import ConditionEditor from "../editors/ConditionEditor";

export default function SubjectBlock({ value, onChange }) {
  return (
    <Block title="Sujet de l’indicateur">
      <div>
        <strong>Tables</strong>
        <input
          placeholder="ex: etudiant,diplome"
          value={value.tables.join(",")}
          onChange={e =>
            onChange({
              ...value,
              tables: e.target.value.split(",").map(t => t.trim())
            })
          }
        />
      </div>

      <ConditionEditor
        value={value.conditions}
        onChange={cond =>
          onChange({ ...value, conditions: cond })
        }
      />
    </Block>
  );
}
