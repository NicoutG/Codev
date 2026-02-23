import React, { useState } from 'react';
import { authApi } from '../api/auth';
import { Layout } from '../components/common/Layout';
import styles from '../styles/pages/ChangePasswordPage.module.css';

export const ChangePasswordPage: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      setIsLoading(true);
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className={styles.wrapper}>
        <div className={styles.headerSpacing}>
          <h1 className={styles.title}>Changer le mot de passe</h1>
          <p className={styles.subtitle}>Mettez à jour votre mot de passe pour sécuriser votre compte</p>
        </div>

        {success && <div className={styles.successBox}>Mot de passe modifié avec succès</div>}

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.panel}>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Mot de passe actuel</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                placeholder="Entrez votre mot de passe actuel"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Au moins 6 caractères"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirmez votre nouveau mot de passe"
                className={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`${styles.button} ${styles.buttonPrimary} ${isLoading ? styles.buttonPrimaryDisabled : ''}`}
            >
              {isLoading ? 'Modification en cours...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};
