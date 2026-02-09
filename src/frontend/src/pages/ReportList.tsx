import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { reportsApi, Report } from '../api/reports';

const ReportListContent: React.FC = () => {
  const { isEditeur, isAdmin } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await reportsApi.getAll();
      setReports(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des rapports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) {
      try {
        setError('');
        await reportsApi.delete(id);
        loadReports();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Erreur lors de la suppression du rapport');
      }
    }
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
          <p style={{ color: '#64748b' }}>Chargement des rapports...</p>
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
              Rapports
            </h1>
            <p style={{
              fontSize: '0.9375rem',
              color: '#64748b'
            }}>
              Gérez vos rapports d'indicateurs
            </p>
          </div>
          {(isEditeur || isAdmin) && (
            <Link
              to="/reports/new"
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
              + Créer un rapport
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

        {reports.length === 0 ? (
          <div style={{
            padding: '4rem',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <p style={{
              fontSize: '1.125rem',
              color: '#64748b',
              marginBottom: '0.5rem'
            }}>
              Aucun rapport pour le moment
            </p>
            {(isEditeur || isAdmin) && (
              <p style={{
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Créez votre premier rapport pour commencer
              </p>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '1.5rem'
          }}>
            {reports.map((report) => (
              <div
                key={report.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                  border: '1px solid #e2e8f0',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    {report.title}
                  </h3>
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#64748b',
                    marginBottom: '1rem',
                    minHeight: '40px'
                  }}>
                    {report.description || 'Pas de description.'}
                  </p>
                  <div style={{
                    fontSize: '0.8125rem',
                    color: '#94a3b8',
                    marginBottom: '1rem'
                  }}>
                    {report.indicators.length} indicateur{report.indicators.length > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <Link
                    to={`/reports/${report.id}`}
                    style={{
                      padding: '0.625rem 1.25rem',
                      backgroundColor: '#e0e7ff',
                      color: '#1e40af',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      transition: 'all 0.2s ease',
                      flex: 1,
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#c7d2fe';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#e0e7ff';
                    }}
                  >
                    Voir
                  </Link>
                  {(isEditeur || isAdmin) && (
                    <>
                      <Link
                        to={`/reports/${report.id}/edit`}
                        style={{
                          padding: '0.625rem 1.25rem',
                          backgroundColor: '#fef9c3',
                          color: '#a16207',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          transition: 'all 0.2s ease',
                          flex: 1,
                          textAlign: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fde68a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fef9c3';
                        }}
                      >
                        Modifier
                      </Link>
                      <button
                        onClick={() => handleDelete(report.id)}
                        style={{
                          padding: '0.625rem 1.25rem',
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flex: 1
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#fca5a5';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                      >
                        Supprimer
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default function ReportList() {
  return (
    <ProtectedRoute>
      <ReportListContent />
    </ProtectedRoute>
  );
}
