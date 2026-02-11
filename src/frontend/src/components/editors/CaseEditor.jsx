import CaseItemEditor from "./CaseItemEditor";

export default function CaseEditor({ value, onChange }) {
  return (
    <div>
      {value.map((c, i) => (
        <CaseItemEditor
          key={i}
          value={c}
          onChange={newC => {
            const arr = [...value];
            arr[i] = newC;
            onChange(arr);
          }}
          onDelete={() =>
            onChange(value.filter((_, idx) => idx !== i))
          }
        />
      ))}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...value,
            { label: "Nouveau cas", when: { "=": [{ col: "" }, 0] } }
          ])
        }
      >
        Ajouter un cas
      </button>
    </div>
  );
}
