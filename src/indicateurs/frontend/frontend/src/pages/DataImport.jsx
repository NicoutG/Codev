import { useState, useRef } from "react";
import { importExcel, validateExcel } from "../api/importApi";
import { useNavigate } from "react-router-dom";

export default function DataImport() {
  const [file, setFile] = useState(null);
  const [typeDonnee, setTypeDonnee] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  async function handleFileSelect(e) {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setError("");
    setSuccess("");
    setPreview(null);

    // Validate file
    try {
      const validation = await validateExcel(selectedFile);
      if (validation.valid) {
        setPreview(validation.metadata);
        if (validation.detected_type) {
          setTypeDonnee(validation.detected_type);
        }
      } else {
        setError(validation.error || "Fichier invalide");
      }
    } catch (err) {
      setError("Erreur lors de la validation: " + err.message);
    }
  }

  async function handleImport() {
    if (!file) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const result = await importExcel(file, typeDonnee || null);
      setSuccess(`Import réussi ! ${result.rows_imported} lignes importées dans la table ${result.table_name}`);
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError("Erreur lors de l'import: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Importer des données Excel</h1>

      <div style={{
        border: "2px dashed #ddd",
        borderRadius: "8px",
        padding: "40px",
        textAlign: "center",
        marginBottom: "20px",
        backgroundColor: "#f9f9f9"
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            padding: "12px 24px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "16px"
          }}
        >
          Sélectionner un fichier Excel
        </button>
        {file && (
          <p style={{ marginTop: "10px", color: "#666" }}>
            Fichier sélectionné: {file.name}
          </p>
        )}
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

      {success && (
        <div style={{
          backgroundColor: "#efe",
          color: "#3c3",
          padding: "15px",
          borderRadius: "4px",
          marginBottom: "20px"
        }}>
          {success}
        </div>
      )}

      {preview && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Prévisualisation</h3>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              Type de données
            </label>
            <select
              value={typeDonnee}
              onChange={(e) => setTypeDonnee(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            >
              <option value="">Détection automatique</option>
              <option value="insertion">Insertion des diplômés</option>
              <option value="mobilite">Mobilité internationale</option>
              <option value="reussite">Suivi de réussite</option>
            </select>
          </div>

          <div style={{
            backgroundColor: "#f5f5f5",
            padding: "15px",
            borderRadius: "4px",
            marginBottom: "15px"
          }}>
            <p><strong>Colonnes détectées:</strong> {preview.columns.length}</p>
            <p><strong>Lignes:</strong> {preview.row_count}</p>
            <div style={{ marginTop: "10px" }}>
              <strong>Colonnes:</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "5px" }}>
                {preview.columns.map((col, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: "4px 8px",
                      backgroundColor: "#e3f2fd",
                      borderRadius: "4px",
                      fontSize: "12px"
                    }}
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {preview.sample_data && preview.sample_data.length > 0 && (
            <div>
              <strong>Aperçu des données (5 premières lignes):</strong>
              <div style={{ overflowX: "auto", marginTop: "10px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      {preview.columns.map((col) => (
                        <th key={col} style={{ padding: "8px", border: "1px solid #ddd", textAlign: "left" }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sample_data.slice(0, 5).map((row, idx) => (
                      <tr key={idx}>
                        {preview.columns.map((col) => (
                          <td key={col} style={{ padding: "8px", border: "1px solid #ddd" }}>
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {file && (
        <button
          onClick={handleImport}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: loading ? "#ccc" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          {loading ? "Import en cours..." : "Importer"}
        </button>
      )}
    </div>
  );
}
