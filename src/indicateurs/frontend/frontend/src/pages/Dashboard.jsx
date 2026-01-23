import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getIndicators } from "../api/indicatorApi";
import { getImportHistory } from "../api/importApi";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const [indicators, setIndicators] = useState([]);
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      try {
        const [indicatorsData, importsData] = await Promise.all([
          getIndicators(),
          getImportHistory(),
        ]);
        setIndicators(indicatorsData);
        setImports(importsData.slice(0, 5)); // Last 5 imports
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  const predefinedCount = indicators.filter((i) => i.is_predefined).length;
  const customCount = indicators.length - predefinedCount;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Tableau de bord</h1>
      <p>Bienvenue, {user?.username} ({user?.role})</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginTop: "30px" }}>
        <div style={{
          backgroundColor: "#e3f2fd",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #90caf9"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Indicateurs</h3>
          <p style={{ fontSize: "32px", margin: "0", fontWeight: "bold" }}>{indicators.length}</p>
          <p style={{ margin: "5px 0 0 0", color: "#666" }}>
            {predefinedCount} pré-définis, {customCount} personnalisés
          </p>
          <Link to="/indicators" style={{ display: "block", marginTop: "10px", color: "#1976d2" }}>
            Voir tous →
          </Link>
        </div>

        <div style={{
          backgroundColor: "#f3e5f5",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #ce93d8"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Derniers imports</h3>
          <p style={{ fontSize: "32px", margin: "0", fontWeight: "bold" }}>{imports.length}</p>
          <p style={{ margin: "5px 0 0 0", color: "#666" }}>
            Fichiers importés récemment
          </p>
          {user?.role === "modificateur" && (
            <Link to="/import" style={{ display: "block", marginTop: "10px", color: "#7b1fa2" }}>
              Importer →
            </Link>
          )}
        </div>

        <div style={{
          backgroundColor: "#e8f5e9",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #a5d6a7"
        }}>
          <h3 style={{ margin: "0 0 10px 0" }}>Actions rapides</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link to="/indicators/new" style={{ color: "#2e7d32" }}>
              + Créer un indicateur
            </Link>
            {user?.role === "modificateur" && (
              <Link to="/import" style={{ color: "#2e7d32" }}>
                + Importer des données
              </Link>
            )}
            <Link to="/formulaires" style={{ color: "#2e7d32" }}>
              Voir les formulaires
            </Link>
          </div>
        </div>
      </div>

      {imports.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h2>Derniers imports</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "10px", textAlign: "left", border: "1px solid #ddd" }}>Fichier</th>
                <th style={{ padding: "10px", textAlign: "left", border: "1px solid #ddd" }}>Type</th>
                <th style={{ padding: "10px", textAlign: "left", border: "1px solid #ddd" }}>Date</th>
                <th style={{ padding: "10px", textAlign: "left", border: "1px solid #ddd" }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {imports.map((imp) => (
                <tr key={imp.id}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>{imp.fichier_nom}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>{imp.type_donnee}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    {new Date(imp.date_import).toLocaleDateString()}
                  </td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      backgroundColor: imp.statut === "success" ? "#c8e6c9" : "#ffcdd2",
                      color: imp.statut === "success" ? "#2e7d32" : "#c62828"
                    }}>
                      {imp.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
