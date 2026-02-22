import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { commonStyles } from '../styles/common';
import { pageStyles } from '../styles/pages';
import styles from '../styles/pages/LoginPage.module.css';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.viewport}>
      {/* Section gauche - Formulaire */}
      <div className={styles.leftPanel}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <h1 className={styles.title}>Connexion</h1>
            <p className={styles.subtitle}>Accédez à votre espace de suivi statistique</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nom d'utilisateur</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Entrez votre nom d'utilisateur" className={styles.inputCustom} />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Entrez votre mot de passe" className={styles.inputCustom} />
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button type="submit" disabled={isLoading} className={`btn btn-primary ${styles.fullWidthBtn}`}>{isLoading ? 'Connexion en cours...' : 'Se connecter'}</button>
          </form>
        </div>
      </div>

      {/* Section droite - Illustration */}
      <div className={styles.rightPanel}>
        <div className={styles.bgOverlay} />
        <div className={styles.hero}>
          <div className={styles.heroTitle}>Polytech Lyon</div>
          <div className={styles.heroSubtitle}>Suivi Statistique</div>
          <div className={styles.heroText}>Outil d'analyse et de suivi de l'insertion professionnelle des diplômés</div>
        </div>
      </div>
    </div>
  );
};
