import TableSelectionEditor from "../editors/TableSelectionEditor";

export default function SubjectBlock({ value, onChange }) {
  return (
      <TableSelectionEditor
        value={value}
        onChange={onChange}
      />
  );
}
