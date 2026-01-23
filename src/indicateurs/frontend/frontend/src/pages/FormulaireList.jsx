import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getFormulaires } from "../api/formulaireApi";
import { useAuth } from "../auth/AuthContext";

export default function FormulaireList() {
  const [formulaires, setFormulaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadFormulaires();
  }, []);

  async function loadFormulaires() {
    try {
      const data = await getFormulaires();
      setFormulaires(data);
    } catch (err) {
      console.error("Error loading formulaires:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div style={{ padding: "20px" }}>Chargement...</div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Formulaires</h1>
        {user?.role === "modificateur" && (
          <Link
            to="/formulaires/new"
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "4px"
            }}
          >
            + Nouveau formulaire
          </Link>
        )}
      </div>

      <div style={{ display: "grid", gap: "15px" }}>
        {formulaires.map((formulaire) => (
          <div
            key={formulaire.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              backgroundColor: "white"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: "0" }}>{formulaire.nom}</h3>
                <p style={{ color: "#666", margin: "10px 0" }}>
                  Demandeur: {formulaire.demandeur} | Template: {formulaire.template_type}
                </p>
                <div style={{ fontSize: "14px", color: "#999" }}>
                  Créé le {new Date(formulaire.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => navigate(`/formulaires/${formulaire.id}/view`)}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  Voir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {formulaires.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#999" }}>
          Aucun formulaire. {user?.role === "modificateur" && "Créez-en un nouveau !"}
        </div>
      )}
    </div>
  );
}
