import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./Header.css";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <Link to="/dashboard" className="logo">
          <div className="logo-icon">📊</div>
          <div className="logo-text">
            <span className="logo-title">PolyStats</span>
            <span className="logo-subtitle">Gestion des indicateurs</span>
          </div>
        </Link>

        <nav className="header-nav">
          {user && (
            <>
              <Link to="/dashboard" className="nav-link">
                <span className="nav-icon">🏠</span>
                Dashboard
              </Link>
              <Link to="/indicators" className="nav-link">
                <span className="nav-icon">📈</span>
                Indicateurs
              </Link>
              <Link to="/data" className="nav-link">
                <span className="nav-icon">💾</span>
                Données
              </Link>
              {user.role === "modificateur" && (
                <Link to="/import" className="nav-link">
                  <span className="nav-icon">📥</span>
                  Import
                </Link>
              )}
              <Link to="/formulaires" className="nav-link">
                <span className="nav-icon">📋</span>
                Formulaires
              </Link>
              {user.role === "modificateur" && (
                <Link to="/users" className="nav-link">
                  <span className="nav-icon">👥</span>
                  Utilisateurs
                </Link>
              )}
            </>
          )}
        </nav>

        {user && (
          <div className="header-user">
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-role">{user.role}</span>
            </div>
            <div className="user-menu">
              <Link to="/change-password" className="user-menu-item">
                🔒 Mot de passe
              </Link>
              <button onClick={handleLogout} className="user-menu-item logout">
                🚪 Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
