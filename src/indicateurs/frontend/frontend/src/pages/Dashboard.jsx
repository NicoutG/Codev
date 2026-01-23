import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getIndicators } from "../api/indicatorApi";
import { getImportHistory } from "../api/importApi";
import { useAuth } from "../auth/AuthContext";
import PageHeader from "../components/UI/PageHeader";
import "./Dashboard.css";

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
        setImports(importsData.slice(0, 5));
      } catch (err) {
        console.error("Error loading dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const predefinedCount = indicators.filter((i) => i.is_predefined).length;
  const customCount = indicators.length - predefinedCount;

  return (
    <div className="dashboard">
      <PageHeader
        title="Tableau de bord"
        subtitle={`Bienvenue, ${user?.username} - ${user?.role === "modificateur" ? "Administrateur" : "Consultant"}`}
      />

      <div className="stats-grid">
        <div className="stat-card stat-card-primary">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{indicators.length}</div>
            <div className="stat-label">Indicateurs</div>
            <div className="stat-detail">
              {predefinedCount} pré-définis, {customCount} personnalisés
            </div>
          </div>
          <Link to="/indicators" className="stat-link">
            Voir tous →
          </Link>
        </div>

        <div className="stat-card stat-card-success">
          <div className="stat-icon">💾</div>
          <div className="stat-content">
            <div className="stat-value">{imports.length}</div>
            <div className="stat-label">Derniers imports</div>
            <div className="stat-detail">Fichiers importés récemment</div>
          </div>
          {user?.role === "modificateur" && (
            <Link to="/import" className="stat-link">
              Importer →
            </Link>
          )}
        </div>

        <div className="stat-card stat-card-info">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">—</div>
            <div className="stat-label">Formulaires</div>
            <div className="stat-detail">Rapports disponibles</div>
          </div>
          <Link to="/formulaires" className="stat-link">
            Voir →
          </Link>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">—</div>
            <div className="stat-label">Utilisateurs</div>
            <div className="stat-detail">Gestion des accès</div>
          </div>
          {user?.role === "modificateur" && (
            <Link to="/users" className="stat-link">
              Gérer →
            </Link>
          )}
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Actions rapides</h2>
          </div>
          <div className="quick-actions">
            {user?.role === "modificateur" && (
              <>
                <Link to="/indicators/new" className="quick-action-btn">
                  <span className="action-icon">➕</span>
                  <span>Créer un indicateur</span>
                </Link>
                <Link to="/import" className="quick-action-btn">
                  <span className="action-icon">📥</span>
                  <span>Importer des données</span>
                </Link>
                <Link to="/users" className="quick-action-btn">
                  <span className="action-icon">👥</span>
                  <span>Gérer les utilisateurs</span>
                </Link>
              </>
            )}
            <Link to="/data" className="quick-action-btn">
              <span className="action-icon">💾</span>
              <span>Voir les données</span>
            </Link>
            <Link to="/formulaires" className="quick-action-btn">
              <span className="action-icon">📋</span>
              <span>Voir les formulaires</span>
            </Link>
            <Link to="/change-password" className="quick-action-btn">
              <span className="action-icon">🔒</span>
              <span>Changer mon mot de passe</span>
            </Link>
          </div>
        </div>
      </div>

      {imports.length > 0 && (
        <div className="recent-imports">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Derniers imports</h2>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Fichier</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => (
                  <tr key={imp.id}>
                    <td>{imp.fichier_nom}</td>
                    <td>
                      <span className="badge badge-info">{imp.type_donnee}</span>
                    </td>
                    <td>{new Date(imp.date_import).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`badge ${
                          imp.statut === "success"
                            ? "badge-success"
                            : "badge-danger"
                        }`}
                      >
                        {imp.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
