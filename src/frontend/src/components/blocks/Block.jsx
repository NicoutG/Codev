export default function Block({ title, onDelete, children }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 15 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{title}</strong>
        {onDelete && (
          <button type="button" onClick={onDelete}>❌</button>
        )}
      </div>
      {children}
    </div>
  );
}
