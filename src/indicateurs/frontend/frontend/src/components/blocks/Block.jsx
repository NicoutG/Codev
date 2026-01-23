export default function Block({ title, onDelete, children }) {
  return (
    <div style={{ 
      border: "1px solid #ddd", 
      borderRadius: "8px",
      padding: "15px", 
      marginBottom: "15px",
      backgroundColor: "white",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
    }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "15px",
        paddingBottom: "10px",
        borderBottom: "1px solid #eee"
      }}>
        <strong style={{ fontSize: "16px" }}>{title || "Nouvelle colonne"}</strong>
        {onDelete && (
          <button 
            onClick={onDelete}
            style={{
              padding: "4px 8px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            ❌ Supprimer
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {children}
      </div>
    </div>
  );
}
