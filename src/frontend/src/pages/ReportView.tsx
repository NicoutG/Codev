import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { reportsApi, Report, ReportGenerateResponse } from '../api/reports';
import { Chart } from '../components/charts/Chart';

const exportFormats = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel (XLSX)' }
];

const ReportViewContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const reportId = id ? parseInt(id) : null;
  const { isEditeur, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [generatedReport, setGeneratedReport] = useState<ReportGenerateResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId]);

  const loadReport = async () => {
    if (!reportId) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await reportsApi.getById(reportId);
      setReport(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement du rapport');
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async () => {
    if (!reportId) return;
    try {
      setIsGenerating(true);
      setError('');
      const result = await reportsApi.generate(reportId);
      setGeneratedReport(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (format: string) => {
    if (!reportId) return;
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/reports/${reportId}/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erreur lors de l\'export' }));
        throw new Error(errorData.detail || 'Erreur lors de l\'export');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `report_${reportId}.${format}`;
      if (contentDisposition) {
        const matches = /filename="(.+)"/.exec(contentDisposition);
        if (matches) {
          filename = matches[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'export du rapport');
    }
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
          <p style={{ color: '#64748b' }}>Chargement du rapport...</p>
        </div>
      </Layout>
    );
  }

  if (error && !report) {
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
            {error}
          </p>
          <button
            onClick={() => navigate('/reports')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Retour à la liste
          </button>
        </div>
      </Layout>
    );
  }

  if (!report) return null;

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
              {report.title}
            </h1>
            {report.description && (
              <p style={{
                fontSize: '0.9375rem',
                color: '#64748b',
                marginBottom: '1rem',
                lineHeight: '1.6'
              }}>
                {report.description}
              </p>
            )}
            <div style={{
              fontSize: '0.8125rem',
              color: '#94a3b8'
            }}>
              {report.indicators.length} indicateur{report.indicators.length > 1 ? 's' : ''} dans ce rapport
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={generateReport}
              disabled={isGenerating}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: isGenerating ? '#94a3b8' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: '500',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isGenerating ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isGenerating) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              {isGenerating ? '⏳ Génération...' : '▶️ Générer le rapport'}
            </button>
            {(isEditeur || isAdmin) && (
              <Link
                to={`/reports/${report.id}/edit`}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#e0e7ff',
                  color: '#1e40af',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(30, 64, 175, 0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#c7d2fe';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#e0e7ff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Modifier
              </Link>
            )}
            {generatedReport && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {exportFormats.map(format => (
                  <button
                    key={format.value}
                    onClick={() => handleExport(format.value)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#f1f5f9',
                      color: '#64748b',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
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
                    📥 {format.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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

        {isGenerating ? (
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
            <p style={{ color: '#64748b' }}>Génération du rapport en cours...</p>
          </div>
        ) : generatedReport ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {generatedReport.results.map((result, idx) => {
              const indicatorConfig = report.indicators.find(i => i.id === result.indicator_id);
              const hasError = result.execution_result.error;
              
              return (
                <div
                  key={result.indicator_id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                    border: '1px solid #e2e8f0',
                    padding: '2rem'
                  }}
                >
                  <div style={{
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    <h2 style={{
                      fontSize: '1.5rem',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '0.5rem'
                    }}>
                      {result.indicator_title}
                    </h2>
                    {hasError && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: '#fef2f2',
                        color: '#991b1b',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        marginTop: '0.5rem'
                      }}>
                        Erreur: {result.execution_result.error}
                      </div>
                    )}
                  </div>

                  {!hasError && result.execution_result.rows.length > 0 && (
                    <>
                      {/* Graphique si configuré */}
                      {indicatorConfig?.chart_type && (
                        <div style={{ marginBottom: '2rem' }}>
                          <Chart
                            type={indicatorConfig.chart_type as 'bar' | 'line' | 'pie' | 'area'}
                            data={result.execution_result.rows}
                            columns={result.execution_result.columns}
                            title={result.indicator_title}
                            config={indicatorConfig.chart_config}
                          />
                        </div>
                      )}

                      {/* Tableau des résultats */}
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
                              {result.execution_result.columns.map((col) => (
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
                            {result.execution_result.rows.map((row, rowIdx) => (
                              <tr
                                key={rowIdx}
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
                                {result.execution_result.columns.map((col) => (
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

                      <div style={{
                        marginTop: '1rem',
                        fontSize: '0.875rem',
                        color: '#64748b',
                        textAlign: 'right'
                      }}>
                        {result.execution_result.row_count} ligne{result.execution_result.row_count > 1 ? 's' : ''}
                      </div>
                    </>
                  )}

                  {!hasError && result.execution_result.rows.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <p style={{
                        fontSize: '1rem',
                        color: '#64748b'
                      }}>
                        Aucun résultat retourné par cet indicateur
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
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
              marginBottom: '1rem'
            }}>
              Aucun résultat généré
            </p>
            <p style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              marginBottom: '1.5rem'
            }}>
              Cliquez sur "Générer le rapport" pour exécuter tous les indicateurs et afficher les résultats
            </p>
            <button
              onClick={generateReport}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9375rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e3a8a';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e40af';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Générer le rapport
            </button>
          </div>
        )}

        <div style={{
          marginTop: '2rem',
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => navigate('/reports')}
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

export default function ReportView() {
  return (
    <ProtectedRoute>
      <ReportViewContent />
    </ProtectedRoute>
  );
}
