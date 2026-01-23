import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTableData, updateTableRow, deleteTableRow } from "../api/dataApi";

export default function DataEdit() {
  const { tableName, rowId } = useParams();
  const navigate = useNavigate();
  const [rowData, setRowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRowData();
  }, [tableName, rowId]);

  async function loadRowData() {
    try {
      const data = await getTableData(tableName, null, 1, 0);
      const row = data.data.find(r => (r.id || r.ID || r.Id) == rowId);
      if (row) {
        setRowData(row);
      } else {
        setError("Ligne non trouvée");
      }
    } catch (err) {
      setError("Erreur lors du chargement: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!rowData) return;

    setSaving(true);
    setError("");

    try {
      // Remove id and metadata fields
      const updateData = { ...rowData };
      delete updateData.id;
      delete updateData.ID;
      delete updateData.Id;
      delete updateData.imported_at;
      delete updateData.import_id;

      await updateTableRow(tableName, rowId, updateData);
      navigate(`/data`);
    } catch (err) {
      setError("Erreur lors de la sauvegarde: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette ligne ?")) {
      return;
    }

    try {
      await deleteTableRow(tableName, rowId);
      navigate(`/data`);
    } catch (err) {
      setError("Erreur lors de la suppression: " + err.message);
    }
  }

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  if (error && !rowData) {
    return (
      <div style={{ padding: "20px" }}>
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
        <button onClick={() => navigate("/data")}>Retour</button>
      </div>
    );
  }

  if (!rowData) {
    return <div style={{ padding: "20px" }}>Données non trouvées</div>;
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Éditer la ligne</h1>
        <button
          onClick={() => navigate("/data")}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          ← Retour
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: "#fee",
          color: "#c33",
          padding: "15px",
          borderRadius: "4px",
          marginBottom: "20px"
        }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: "15px" }}>
        {Object.keys(rowData).map((key) => {
          // Skip id and metadata fields
          if (key === "id" || key === "ID" || key === "Id" || key === "imported_at" || key === "import_id") {
            return null;
          }

          return (
            <div key={key}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                {key}
              </label>
              <input
                type="text"
                value={rowData[key] !== null && rowData[key] !== undefined ? String(rowData[key]) : ""}
                onChange={(e) => setRowData({ ...rowData, [key]: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px"
                }}
              />
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "30px" }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "12px 24px",
            backgroundColor: saving ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: saving ? "not-allowed" : "pointer"
          }}
        >
          {saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
        <button
          onClick={handleDelete}
          style={{
            padding: "12px 24px",
            backgroundColor: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Supprimer
        </button>
        <button
          onClick={() => navigate("/data")}
          style={{
            padding: "12px 24px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
