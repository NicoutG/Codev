export default function Block({ title, children, onDelete }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 10, marginTop: 10, position: "relative" }}>
      {onDelete && (
        <button
          onClick={onDelete}
          style={{ position: "absolute", top: 5, right: 5 }}
        >
          ❌
        </button>
      )}
      {title && <h4>{title}</h4>}
      {children}
    </div>
  );
}
