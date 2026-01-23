import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { useAuth } from "./AuthContext";
import "../styles/theme.css";
import "./Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await login(username, password);
      setAuthUser(data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">📊</div>
            <div className="login-logo-text">
              <h1>PolyStats</h1>
              <p>Gestion des indicateurs Polytech Lyon</p>
            </div>
          </div>
        </div>

        <div className="login-card">
          <h2 className="login-title">Connexion</h2>
          <p className="login-subtitle">Connectez-vous pour accéder à votre espace</p>

          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="form-control"
                placeholder="Entrez votre nom d'utilisateur"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-control"
                placeholder="Entrez votre mot de passe"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg login-submit"
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px" }}></div>
                  Connexion...
                </>
              ) : (
                <>
                  <span>🔐</span>
                  Se connecter
                </>
              )}
            </button>
          </form>
        </div>

        <div className="login-footer">
          <p>© 2025 Polytech Lyon - Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
}
