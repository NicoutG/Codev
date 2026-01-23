import React, { useState, useEffect, useCallback } from "react";
import { TableProvider } from "../context/TableContext";
import ConditionEditor from "./ConditionEditor";
import { getTables } from "../../api/metadataApi";

export default function TableSelectionEditor({ value, onChange }) {
  const tables = value?.tables || [];
  const conditions = value?.conditions ?? null;

  const [availableTables, setAvailableTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTables();
      setAvailableTables(data || []);
    } catch (err) {
      console.error("Erreur lors du chargement des tables:", err);
      const errorMessage = err.message || "Impossible de charger les tables";
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
        setError("Vous devez être connecté pour voir les tables. Veuillez vous reconnecter.");
      } else {
        setError(`Erreur: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const toggleTable = tableName => {
    const nextTables = tables.includes(tableName)
      ? tables.filter(t => t !== tableName)
      : [...tables, tableName];
    onChange({ ...value, tables: nextTables });
  };

  // Helper to get table name (handle both string and object formats)
  const getTableName = (table) => typeof table === 'string' ? table : table.name;

  return (
    <TableProvider value={value}>
      <div style={{ 
        border: "1px solid #ddd", 
        borderRadius: "8px",
        padding: "15px",
        backgroundColor: "white"
      }}>
        <strong style={{ fontSize: "16px", display: "block", marginBottom: "10px" }}>
          📊 Tables de données disponibles
        </strong>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "15px" }}>
          Sélectionnez une ou plusieurs tables à utiliser pour cet indicateur
        </p>
        
        {loading && (
          <div style={{ 
            padding: "15px", 
            textAlign: "center",
            color: "#666"
          }}>
            <div style={{ marginBottom: "5px" }}>⏳ Chargement des tables…</div>
            <div style={{ fontSize: "12px" }}>Vérification des données importées...</div>
          </div>
        )}
        {error && (
          <div style={{ 
            color: "#dc3545", 
            padding: "15px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "4px",
            marginBottom: "10px"
          }}>
            <strong>❌ Erreur :</strong> {error}
            <button
              onClick={loadTables}
              style={{
                marginTop: "10px",
                padding: "6px 12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                display: "block"
              }}
            >
              🔄 Réessayer
            </button>
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: "grid", gap: "10px", marginTop: 10 }}>
            {availableTables.length === 0 ? (
              <div style={{ 
                padding: "20px", 
                textAlign: "center", 
                color: "#999",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px"
              }}>
                Aucune table disponible. Importez d'abord des données.
              </div>
            ) : (
              availableTables.map(table => {
                const tableName = getTableName(table);
                const isSelected = tables.includes(tableName);
                const tableInfo = typeof table === 'object' ? table : null;
                
                return (
                  <label 
                    key={tableName}
                    style={{ 
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      border: isSelected ? "2px solid #007bff" : "1px solid #ddd",
                      borderRadius: "6px",
                      backgroundColor: isSelected ? "#e7f3ff" : "white",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleTable(tableName)}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                        {tableName}
                      </div>
                      {tableInfo && (
                        <div style={{ fontSize: "12px", color: "#666" }}>
                          {tableInfo.type_donnee && (
                            <span style={{ marginRight: "10px" }}>
                              Type: {tableInfo.type_donnee}
                            </span>
                          )}
                          {tableInfo.row_count !== undefined && (
                            <span>
                              {tableInfo.row_count.toLocaleString()} lignes
                            </span>
                          )}
                          {tableInfo.columns && tableInfo.columns.length > 0 && (
                            <span style={{ marginLeft: "10px" }}>
                              • {tableInfo.columns.length} colonnes
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        )}

        <strong style={{ marginTop: 10, display: "block" }}>Conditions</strong>
        {conditions && (
          <button
            style={{ margin: "6px 0" }}
            onClick={() => onChange({ ...value, conditions: null })}
          >
            ✕ Supprimer les conditions
          </button>
        )}

        <ConditionEditor
          value={conditions}
          onChange={cond => onChange({ ...value, conditions: cond })}
        />
      </div>
    </TableProvider>
  );
}
