import React, { useState, useEffect } from 'react';
import { usersApi, User, UserCreate } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import styles from '../styles/pages/UsersPage.module.css';

const UsersPageContent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    password: '',
    role: 'consultant'
  });

  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await usersApi.create(formData);
      setShowCreateForm(false);
      setFormData({ username: '', email: '', password: '', role: 'consultant' });
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleUpdateRole = async (userId: number, role: 'consultant_rapport' | 'consultant' | 'editeur' | 'admin') => {
    try {
      setError('');
      await usersApi.updateRole(userId, role);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la modification du rôle');
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }
    try {
      setError('');
      await usersApi.delete(userId);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      consultant_rapport: 'Consultant Rapport',
      consultant: 'Consultant',
      editeur: 'Éditeur',
      admin: 'Administrateur'
    };
    return labels[role] || role;
  };

  const getRoleBadgeStyle = (role: string) => {
    const styles: Record<string, { bg: string; color: string }> = {
      consultant_rapport: { bg: '#f1f5f9', color: '#64748b' },
      consultant: { bg: '#f1f5f9', color: '#64748b' },
      editeur: { bg: '#eff6ff', color: '#3b82f6' },
      admin: { bg: '#eef2ff', color: '#1e40af' }
    };
    return styles[role] || styles.consultant;
  };

  return (
    <Layout>
      <div>
        <div className={styles.header}>
          <div>
            <h1 className={styles.pageTitle}>
              Gestion des utilisateurs
            </h1>
            <p className={styles.pageSubtitle}>
              Gérez les accès et les permissions des utilisateurs
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className={`btn ${showCreateForm ? 'btn-secondary' : 'btn-primary'}`}
          >
            {showCreateForm ? 'Annuler' : '+ Créer un utilisateur'}
          </button>
        </div>

        {error && (
          <div className={styles.errorBox}>{error}</div>
        )}

        {showCreateForm && (
          <div className={styles.cardCompact}>
            <h2 className={styles.pageTitle} style={{ fontSize: '1.25rem', marginBottom: '1.5rem', fontWeight: 600 }}>
              Créer un nouvel utilisateur
            </h2>
            <form onSubmit={handleCreate}>
              <div className={styles.formGrid}>
                <div>
                  <label className="label">Nom d'utilisateur</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="nom.utilisateur"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="utilisateur@polytech-lyon.fr"
                    className="input"
                  />
                </div>
              </div>
              <div className={styles.formGrid}>
                <div>
                  <label className="label">Mot de passe</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Mot de passe sécurisé"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="input"
                  >
                    <option value="consultant_rapport">Consultant Rapport</option>
                    <option value="consultant">Consultant</option>
                    <option value="editeur">Éditeur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn btn-success">Créer l'utilisateur</button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Chargement...</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className="table">
              <thead>
                <tr className={styles.tableHeaderRow}>
                  <th className={styles.tableHeaderCell}>Utilisateur</th>
                  <th className={styles.tableHeaderCell}>Email</th>
                  <th className={styles.tableHeaderCell}>Rôle</th>
                  <th className={styles.tableHeaderCell} style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const badgeStyle = getRoleBadgeStyle(user.role);
                  const isCurrentUser = user.id === currentUser?.id;
                  return (
                    <tr key={user.id}>
                      <td className={styles.tableCell}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className={styles.avatar}>{user.username.charAt(0).toUpperCase()}</div>
                          <div>
                            <div className={styles.username}>{user.username}</div>
                            {isCurrentUser && <div className={styles.usernameSub}>(Vous)</div>}
                          </div>
                        </div>
                      </td>
                      <td className={styles.tableCell}>{user.email}</td>
                      <td className={styles.tableCell}>
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value as any)}
                          disabled={isCurrentUser}
                          className={styles.smallSelect}
                        >
                          <option value="consultant_rapport">Consultant Rapport</option>
                          <option value="consultant">Consultant</option>
                          <option value="editeur">Éditeur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </td>
                      <td className={`${styles.tableCell} ${styles.tableCellRight}`}>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={isCurrentUser}
                          className={`btn ${isCurrentUser ? 'btn-secondary' : 'btn-danger'}`}
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && !isLoading && (
              <div style={{
                padding: '4rem',
                textAlign: 'center',
                color: '#64748b'
              }}>
                Aucun utilisateur trouvé
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export const UsersPage: React.FC = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      <UsersPageContent />
    </ProtectedRoute>
  );
};
