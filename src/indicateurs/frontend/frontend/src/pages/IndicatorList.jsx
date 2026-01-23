import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getIndicators, deleteIndicator } from "../api/indicatorApi";
import { useAuth } from "../auth/AuthContext";
import PageHeader from "../components/UI/PageHeader";
import "./IndicatorList.css";

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
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="indicator-list">
      <PageHeader
        title="Indicateurs"
        subtitle={`${indicators.length} indicateur${indicators.length > 1 ? "s" : ""} disponible${indicators.length > 1 ? "s" : ""}`}
        actions={
          user?.role === "modificateur" && (
            <Link to="/indicators/new" className="btn btn-primary">
              <span>➕</span>
              Nouvel indicateur
            </Link>
          )
        }
      />

      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher un indicateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredIndicators.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>Aucun indicateur trouvé</h3>
          <p>
            {searchTerm
              ? "Aucun indicateur ne correspond à votre recherche"
              : "Aucun indicateur disponible"}
          </p>
          {user?.role === "modificateur" && !searchTerm && (
            <Link to="/indicators/new" className="btn btn-primary">
              Créer le premier indicateur
            </Link>
          )}
        </div>
      ) : (
        <div className="indicators-grid">
          {filteredIndicators.map((indicator) => (
            <div key={indicator.id} className="indicator-card">
              <div className="indicator-card-header">
                <div className="indicator-title-section">
                  <h3 className="indicator-title">{indicator.title}</h3>
                  {indicator.is_predefined && (
                    <span className="badge badge-warning">Pré-défini</span>
                  )}
                </div>
              </div>

              {indicator.description && (
                <p className="indicator-description">{indicator.description}</p>
              )}

              <div className="indicator-card-footer">
                <div className="indicator-actions">
                  <button
                    onClick={() => navigate(`/indicators/${indicator.id}/results`)}
                    className="btn btn-success btn-sm"
                  >
                    <span>📊</span>
                    Calculer
                  </button>
                  {user?.role === "modificateur" && (
                    <Link
                      to={`/indicators/${indicator.id}/edit`}
                      className="btn btn-info btn-sm"
                    >
                      <span>✏️</span>
                      Éditer
                    </Link>
                  )}
                  {user?.role === "modificateur" && !indicator.is_predefined && (
                    <button
                      onClick={() => handleDelete(indicator.id)}
                      className="btn btn-danger btn-sm"
                    >
                      <span>🗑️</span>
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
