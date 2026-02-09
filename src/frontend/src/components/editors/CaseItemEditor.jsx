import ConditionEditor from "./ConditionEditor";

export default function CaseItemEditor({ value, onChange, onDelete }) {
  return (
    <div style={{ border: "1px solid #ccc", marginBottom: 5 }}>
      <input
        placeholder="Label"
        value={value.label}
        onChange={e =>
          onChange({ ...value, label: e.target.value })
        }
      />

      <ConditionEditor
        value={value.when}
        onChange={when =>
          onChange({ ...value, when })
        }
      />

      <button onClick={onDelete}>❌</button>
    </div>
  );
}
