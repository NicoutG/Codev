import { useState, useEffect } from "react";
import { getDataTables, getTableData, getTableYears } from "../api/dataApi";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function DataList() {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, limit: 100, offset: 0 });
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadYears();
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable) {
      setPagination({ total: 0, limit: 100, offset: 0 });
      loadTableData();
    }
  }, [selectedTable, selectedYear]);

  async function loadTables() {
    try {
      setError(null);
      const data = await getDataTables();
      console.log("Tables loaded:", data);
      setTables(data || []);
    } catch (err) {
      console.error("Error loading tables:", err);
      setError(`Erreur lors du chargement des données: ${err.message || "Erreur inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadYears() {
    if (!selectedTable) return;
    try {
      const data = await getTableYears(selectedTable.table_name);
      setYears(data);
    } catch (err) {
      console.error("Error loading years:", err);
    }
  }

  async function loadTableData() {
    if (!selectedTable) return;
    setLoadingData(true);
    try {
      const data = await getTableData(
        selectedTable.table_name,
        selectedYear,
        pagination.limit,
        pagination.offset
      );
      setTableData(data.data);
      setPagination({ ...pagination, total: data.total });
    } catch (err) {
      alert("Erreur lors du chargement: " + err.message);
    } finally {
      setLoadingData(false);
    }
  }

  async function handleDeleteImport(tableName) {
    // Find import record for this table
    const table = tables.find(t => t.table_name === tableName);
    if (!table || !table.import_id) return;

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet import et toutes ses données ?")) {
      return;
    }

    try {
      const { deleteImport } = await import("../api/dataApi");
      await deleteImport(table.import_id);
      loadTables();
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  }

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Données importées</h1>
        {user?.role === "modificateur" && (
          <button
            onClick={() => navigate("/import")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            + Importer des données
          </button>
        )}
      </div>

      {error && (
        <div style={{
          padding: "15px",
          backgroundColor: "#f8d7da",
          color: "#721c24",
          borderRadius: "4px",
          marginBottom: "20px",
          border: "1px solid #f5c6cb"
        }}>
          <strong>Erreur:</strong> {error}
          <button
            onClick={() => {
              setError(null);
              loadTables();
            }}
            style={{
              marginLeft: "10px",
              padding: "5px 10px",
              backgroundColor: "#721c24",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Réessayer
          </button>
        </div>
      )}

      {!selectedTable ? (
        <div style={{ display: "grid", gap: "15px" }}>
          {tables.map((table) => (
            <div
              key={table.table_name}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "20px",
                backgroundColor: "white",
                cursor: "pointer"
              }}
              onClick={() => setSelectedTable(table)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0" }}>{table.table_name}</h3>
                  <p style={{ color: "#666", margin: "10px 0" }}>
                    Type: {table.type_donnee} | Lignes: {table.row_count} | Colonnes: {table.columns.length}
                  </p>
                  <div style={{ fontSize: "14px", color: "#999" }}>
                    Importé le {new Date(table.import_date).toLocaleDateString()}
                  </div>
                </div>
                {user?.role === "modificateur" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImport(table.table_name);
                    }}
                    className="btn btn-danger btn-sm"
                  >
                    <span>🗑️</span>
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          ))}
          {tables.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
              Aucune donnée importée. {user?.role === "modificateur" && "Importez-en !"}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => {
                setSelectedTable(null);
                setSelectedYear(null);
                setTableData([]);
              }}
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
            <h2 style={{ margin: 0 }}>{selectedTable.table_name}</h2>
            {years.length > 0 && (
              <div>
                <label style={{ marginRight: "10px" }}>Année:</label>
                <select
                  value={selectedYear || ""}
                  onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : null)}
                  style={{
                    padding: "8px",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                  }}
                >
                  <option value="">Toutes les années</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {loadingData ? (
            <div style={{ padding: "20px", textAlign: "center" }}>Chargement des données...</div>
          ) : (
            <>
              <div style={{ marginBottom: "10px", color: "#666" }}>
                Affichage de {tableData.length} sur {pagination.total} lignes
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f0f0f0" }}>
                      {tableData.length > 0 && Object.keys(tableData[0]).map((key) => (
                        <th key={key} style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>
                          {key}
                        </th>
                      ))}
                      {user?.role === "modificateur" && tableData.length > 0 && (
                        <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "left" }}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row, idx) => (
                      <tr key={row.id || idx}>
                        {Object.keys(tableData[0]).map((key) => (
                          <td key={key} style={{ padding: "10px", border: "1px solid #ddd" }}>
                            {row[key] !== null && row[key] !== undefined ? String(row[key]) : ""}
                          </td>
                        ))}
                        {user?.role === "modificateur" && (
                          <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                            <button
                              onClick={() => navigate(`/data/${selectedTable.table_name}/edit/${row.id}`)}
                              style={{
                                padding: "4px 8px",
                                backgroundColor: "#17a2b8",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px"
                              }}
                            >
                              Éditer
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.total > pagination.limit && (
                <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
                  <button
                    onClick={() => {
                      setPagination({ ...pagination, offset: Math.max(0, pagination.offset - pagination.limit) });
                      loadTableData();
                    }}
                    disabled={pagination.offset === 0}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: pagination.offset === 0 ? "#ccc" : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: pagination.offset === 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => {
                      setPagination({ ...pagination, offset: pagination.offset + pagination.limit });
                      loadTableData();
                    }}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: pagination.offset + pagination.limit >= pagination.total ? "#ccc" : "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: pagination.offset + pagination.limit >= pagination.total ? "not-allowed" : "pointer"
                    }}
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
