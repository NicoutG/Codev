import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getIndicators, deleteIndicator } from "../api/indicatorApi";
import { useAuth } from "../auth/AuthContext";

export default function IndicatorList() {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadIndicators();
  }, []);

  async function loadIndicators() {
    try {
      const data = await getIndicators();
      setIndicators(data);
    } catch (err) {
      console.error("Error loading indicators:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet indicateur ?")) {
      return;
    }
    try {
      await deleteIndicator(id);
      setIndicators(indicators.filter((i) => i.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression: " + err.message);
    }
  }

  const filteredIndicators = indicators.filter((indicator) =>
    indicator.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (indicator.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Indicateurs</h1>
        {user?.role === "modificateur" && (
          <Link
            to="/indicators/new"
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px"
            }}
          >
            + Nouvel indicateur
          </Link>
        )}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Rechercher un indicateur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "400px",
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: "4px"
          }}
        />
      </div>

      <div style={{ display: "grid", gap: "15px" }}>
        {filteredIndicators.map((indicator) => (
          <div
            key={indicator.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              backgroundColor: indicator.is_predefined ? "#fff9e6" : "white"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ margin: "0" }}>{indicator.title}</h3>
                  {indicator.is_predefined && (
                    <span style={{
                      padding: "2px 8px",
                      backgroundColor: "#ffc107",
                      color: "#000",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}>
                      Pré-défini
                    </span>
                  )}
                </div>
                {indicator.description && (
                  <p style={{ color: "#666", margin: "10px 0" }}>{indicator.description}</p>
                )}
                <div style={{ fontSize: "14px", color: "#999", marginTop: "10px" }}>
                  Créé le {new Date(indicator.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                <button
                  onClick={() => navigate(`/indicators/${indicator.id}/results`)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Calculer
                </button>
                <Link
                  to={`/indicators/${indicator.id}/edit`}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#17a2b8",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "4px",
                    display: "inline-block"
                  }}
                >
                  Éditer
                </Link>
                {user?.role === "modificateur" && !indicator.is_predefined && (
                  <button
                    onClick={() => handleDelete(indicator.id)}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredIndicators.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
          {searchTerm ? "Aucun indicateur ne correspond à votre recherche" : "Aucun indicateur"}
        </div>
      )}
    </div>
  );
}
