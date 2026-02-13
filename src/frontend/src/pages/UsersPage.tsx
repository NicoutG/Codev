import React, { useState, useEffect } from 'react';
import { usersApi, User, UserCreate } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { commonStyles } from '../styles/common';
import { pageStyles } from '../styles/pages';

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
        <div style={commonStyles.flexRowBetween}>
          <div>
            <h1 style={commonStyles.pageTitle}>
              Gestion des utilisateurs
            </h1>
            <p style={commonStyles.pageSubtitle}>
              Gérez les accès et les permissions des utilisateurs
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: showCreateForm ? '#64748b' : '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9375rem',
              transition: 'all 0.2s ease',
              boxShadow: showCreateForm ? 'none' : '0 4px 12px rgba(30, 64, 175, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!showCreateForm) {
                e.currentTarget.style.backgroundColor = '#1e3a8a';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!showCreateForm) {
                e.currentTarget.style.backgroundColor = '#1e40af';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            {showCreateForm ? 'Annuler' : '+ Créer un utilisateur'}
          </button>
        </div>

        {error && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        {showCreateForm && (
          <div style={{
            marginBottom: '2rem',
            padding: '2rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '1.5rem'
            }}>
              Créer un nouvel utilisateur
            </h2>
            <form onSubmit={handleCreate}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    placeholder="nom.utilisateur"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9375rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="utilisateur@polytech-lyon.fr"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9375rem'
                    }}
                  />
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    placeholder="Mot de passe sécurisé"
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9375rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    Rôle
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9375rem',
                      backgroundColor: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="consultant_rapport">Consultant Rapport</option>
                    <option value="consultant">Consultant</option>
                    <option value="editeur">Éditeur</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9375rem',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Créer l'utilisateur
              </button>
            </form>
          </div>
        )}

        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTopColor: '#1e40af',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '1rem', color: '#64748b' }}>Chargement...</p>
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Utilisateur
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Email
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Rôle
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Catégorie
                  </th>
                  <th style={{
                    padding: '1rem 1.5rem',
                    textAlign: 'right',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid #e2e8f0'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const badgeStyle = getRoleBadgeStyle(user.role);
                  const isCurrentUser = user.id === currentUser?.id;
                  return (
                    <tr key={user.id} style={{
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                    >
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#eff6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#1e40af',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                          }}>
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9375rem', fontWeight: '600', color: '#1e293b' }}>
                              {user.username}
                            </div>
                            {isCurrentUser && (
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                (Vous)
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: '#64748b', fontSize: '0.9375rem' }}>
                        {user.email}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user.id, e.target.value as any)}
                          disabled={isCurrentUser}
                          style={{
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            backgroundColor: isCurrentUser ? '#f8fafc' : 'white',
                            color: '#1e293b',
                            cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          <option value="consultant_rapport">Consultant Rapport</option>
                          <option value="consultant">Consultant</option>
                          <option value="editeur">Éditeur</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={isCurrentUser}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: isCurrentUser ? '#f1f5f9' : '#ef4444',
                            color: isCurrentUser ? '#94a3b8' : 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: isCurrentUser ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: isCurrentUser ? 0.6 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!isCurrentUser) {
                              e.currentTarget.style.backgroundColor = '#dc2626';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCurrentUser) {
                              e.currentTarget.style.backgroundColor = '#ef4444';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }
                          }}
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
