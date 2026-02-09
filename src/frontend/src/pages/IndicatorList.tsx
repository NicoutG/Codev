import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { indicatorsApi, Indicator } from '../api/indicators';

const IndicatorListContent: React.FC = () => {
  const { isEditeur, user } = useAuth();
  const navigate = useNavigate();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await indicatorsApi.getAll();
      setIndicators(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des indicateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'indicateur "${title}" ? Cette action est irréversible.`)) {
      return;
    }
    try {
      setError('');
      await indicatorsApi.delete(id);
      loadIndicators();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              Indicateurs
            </h1>
            <p style={{
              fontSize: '0.9375rem',
              color: '#64748b'
            }}>
              Gérez et visualisez vos indicateurs statistiques
            </p>
          </div>
          {isEditeur && (
            <Link
              to="/indicators/new"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1e40af',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e3a8a';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 64, 175, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e40af';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 64, 175, 0.3)';
              }}
            >
              + Créer un indicateur
            </Link>
          )}
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

        {isLoading ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              display: 'inline-block',
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTopColor: '#1e40af',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '1rem'
            }} />
            <p style={{ color: '#64748b' }}>Chargement des indicateurs...</p>
          </div>
        ) : indicators.length === 0 ? (
          <div style={{
            padding: '4rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '1rem',
              opacity: 0.3
            }}>
              📊
            </div>
            <p style={{
              fontSize: '1.125rem',
              color: '#64748b',
              marginBottom: '0.5rem'
            }}>
              Aucun indicateur pour le moment
            </p>
            {isEditeur && (
              <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Créez votre premier indicateur pour commencer
              </p>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ padding: '1.5rem' }}>
              {indicators.map((indicator) => (
                <div
                  key={indicator.id}
                  style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e2e8f0',
                    transition: 'background-color 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                  onClick={() => navigate(`/indicators/${indicator.id}`)}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '0.5rem'
                      }}>
                        {indicator.title}
                      </h3>
                      {indicator.description && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          marginBottom: '0.75rem',
                          lineHeight: '1.5'
                        }}>
                          {indicator.description}
                        </p>
                      )}
                      <div style={{
                        display: 'flex',
                        gap: '1.5rem',
                        fontSize: '0.8125rem',
                        color: '#94a3b8'
                      }}>
                        <span>Créé le {formatDate(indicator.created_at)}</span>
                        {indicator.updated_at && indicator.updated_at !== indicator.created_at && (
                          <span>Modifié le {formatDate(indicator.updated_at)}</span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/indicators/${indicator.id}`);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#dbeafe';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }}
                      >
                        Voir
                      </button>
                      {isEditeur && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/indicators/${indicator.id}/edit`);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#f0fdf4',
                              color: '#10b981',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#dcfce7';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#f0fdf4';
                            }}
                          >
                            Modifier
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(indicator.id, indicator.title);
                            }}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#fef2f2',
                              color: '#ef4444',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#fee2e2';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#fef2f2';
                            }}
                          >
                            Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default function IndicatorList() {
  return (
    <ProtectedRoute>
      <IndicatorListContent />
    </ProtectedRoute>
  );
}
