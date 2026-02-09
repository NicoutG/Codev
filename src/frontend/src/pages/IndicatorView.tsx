import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { indicatorsApi, Indicator } from '../api/indicators';

interface ExecutionResult {
  sql: string;
  columns: string[];
  rows: any[];
  row_count: number;
  indicator_id: number;
  indicator_title: string;
}

const IndicatorViewContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isEditeur } = useAuth();
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'results'>('config');
  
  // États pour l'exécution
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState('');

  useEffect(() => {
    if (id) {
      loadIndicator();
    }
  }, [id]);

  const loadIndicator = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await indicatorsApi.getById(parseInt(id!));
      setIndicator(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement de l\'indicateur');
    } finally {
      setIsLoading(false);
    }
  };

  const executeIndicator = async () => {
    if (!id) return;
    
    try {
      setIsExecuting(true);
      setExecutionError('');
      const result = await indicatorsApi.execute(parseInt(id));
      setExecutionResult(result);
      setActiveTab('results');
    } catch (err: any) {
      setExecutionError(err.response?.data?.detail || 'Erreur lors de l\'exécution de l\'indicateur');
    } finally {
      setIsExecuting(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'number') return value.toLocaleString('fr-FR');
    return String(value);
  };

  if (isLoading) {
    return (
      <Layout>
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
          <p style={{ color: '#64748b' }}>Chargement de l'indicateur...</p>
        </div>
      </Layout>
    );
  }

  if (error || !indicator) {
    return (
      <Layout>
        <div style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>
            {error || 'Indicateur introuvable'}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1e3a8a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1e40af';
            }}
          >
            Retour à la liste
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem'
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              {indicator.title}
            </h1>
            {indicator.description && (
              <p style={{
                fontSize: '0.9375rem',
                color: '#64748b',
                marginBottom: '1rem',
                lineHeight: '1.6'
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
            gap: '0.75rem'
          }}>
            <button
              onClick={executeIndicator}
              disabled={isExecuting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isExecuting ? '#94a3b8' : '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: '500',
                cursor: isExecuting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isExecuting ? 'none' : '0 4px 12px rgba(30, 64, 175, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!isExecuting) {
                  e.currentTarget.style.backgroundColor = '#1e3a8a';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 64, 175, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isExecuting) {
                  e.currentTarget.style.backgroundColor = '#1e40af';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 64, 175, 0.3)';
                }
              }}
            >
              {isExecuting ? '⏳ Exécution...' : '▶️ Exécuter l\'indicateur'}
            </button>
            {isEditeur && (
              <button
                onClick={() => navigate(`/indicators/${indicator.id}/edit`)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
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
                Modifier
              </button>
            )}
          </div>
        </div>

        {/* Onglets */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          borderBottom: '2px solid #e2e8f0'
        }}>
          <button
            onClick={() => setActiveTab('config')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'config' ? '#1e40af' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'config' ? '3px solid #1e40af' : '3px solid transparent',
              borderRadius: '0',
              fontSize: '0.9375rem',
              fontWeight: activeTab === 'config' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-2px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'config') {
                e.currentTarget.style.color = '#475569';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'config') {
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('results')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: activeTab === 'results' ? '#1e40af' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'results' ? '3px solid #1e40af' : '3px solid transparent',
              borderRadius: '0',
              fontSize: '0.9375rem',
              fontWeight: activeTab === 'results' ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '-2px'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== 'results') {
                e.currentTarget.style.color = '#475569';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== 'results') {
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            Résultats {executionResult && `(${executionResult.row_count})`}
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'config' && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '1rem'
            }}>
              Configuration de l'indicateur
            </h2>
            <pre style={{
              backgroundColor: '#f8fafc',
              padding: '1.5rem',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              color: '#1e293b',
              border: '1px solid #e2e8f0',
              maxHeight: '600px'
            }}>
              {JSON.stringify(indicator.indicator, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'results' && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}>
            {executionError && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                fontSize: '0.875rem'
              }}>
                {executionError}
              </div>
            )}

            {isExecuting ? (
              <div style={{
                textAlign: 'center',
                padding: '4rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
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
                <p style={{ color: '#64748b' }}>Exécution de l'indicateur en cours...</p>
              </div>
            ) : executionResult ? (
              <>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  paddingBottom: '1rem',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <div>
                    <h2 style={{
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.5rem'
                    }}>
                      Résultats de l'exécution
                    </h2>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b'
                    }}>
                      {executionResult.row_count} ligne{executionResult.row_count > 1 ? 's' : ''} retournée{executionResult.row_count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {executionResult.rows.length > 0 ? (
                  <div style={{
                    overflowX: 'auto',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: 'white'
                  }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      minWidth: '600px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc' }}>
                          {executionResult.columns.map((col) => (
                            <th
                              key={col}
                              style={{
                                padding: '0.875rem 1rem',
                                textAlign: 'left',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderBottom: '2px solid #e2e8f0'
                              }}
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {executionResult.rows.map((row, idx) => (
                          <tr
                            key={idx}
                            style={{
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
                            {executionResult.columns.map((col) => (
                              <td
                                key={col}
                                style={{
                                  padding: '0.875rem 1rem',
                                  fontSize: '0.875rem',
                                  color: '#1e293b',
                                  maxWidth: '300px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={formatCellValue(row[col])}
                              >
                                {formatCellValue(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '4rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <p style={{
                      fontSize: '1rem',
                      color: '#64748b'
                    }}>
                      Aucun résultat retourné par l'indicateur
                    </p>
                  </div>
                )}

                <details style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  backgroundColor: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <summary style={{
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    Voir la requête SQL générée
                  </summary>
                  <pre style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    backgroundColor: '#1e293b',
                    color: '#e2e8f0',
                    borderRadius: '6px',
                    overflow: 'auto',
                    fontSize: '0.8125rem',
                    lineHeight: '1.5'
                  }}>
                    {executionResult.sql}
                  </pre>
                </details>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '4rem',
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{
                  fontSize: '1rem',
                  color: '#64748b',
                  marginBottom: '1rem'
                }}>
                  Aucun résultat disponible
                </p>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8'
                }}>
                  Cliquez sur "Exécuter l'indicateur" pour voir les résultats
                </p>
              </div>
            )}
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e2e8f0';
              e.currentTarget.style.color = '#475569';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f5f9';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            Retour à la liste
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default function IndicatorView() {
  return (
    <ProtectedRoute>
      <IndicatorViewContent />
    </ProtectedRoute>
  );
}
