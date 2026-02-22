import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { reportsApi, Report, ReportGenerateResponse } from '../api/reports';
import { Chart } from '../components/charts/Chart';
import { commonStyles } from '../styles/common';
import styles from '../styles/pages/ReportView.module.css';

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
        <div className={styles.generating}>
          <div className={styles.generatingSpinner} />
          <p className={styles.generatingText}>Chargement du rapport...</p>
        </div>
      </Layout>
    );
  }

  if (error && !report) {
    return (
      <Layout>
        <div className={`${styles.indicatorCard} ${styles.centerText}`}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <button onClick={() => navigate('/reports')} className="btn btn-primary">Retour à la liste</button>
        </div>
      </Layout>
    );
  }

  if (!report) return null;

  return (
    <Layout>
      <div>
        <div className={styles.header}>
          <div style={{ flex: 1 }}>
            <h1 className={styles.title}>{report.title}</h1>
            {report.description && <p className={styles.subtitle}>{report.description}</p>}
            <div className={styles.infoSmall}>{report.indicators.length} indicateur{report.indicators.length > 1 ? 's' : ''} dans ce rapport</div>
          </div>
          <div className={styles.actions}>
            <button onClick={generateReport} disabled={isGenerating} className={`btn ${isGenerating ? 'btn-secondary' : 'btn-success'}`}>
              {isGenerating ? '⏳ Génération...' : '▶️ Générer le rapport'}
            </button>
            {(isEditeur || isAdmin) && (
              <Link to={`/reports/${report.id}/edit`} className={styles.linkButton}>Modifier</Link>
            )}
            {generatedReport && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {exportFormats.map(format => (
                  <button key={format.value} onClick={() => handleExport(format.value)} className="btn btn-secondary">
                    📥 {format.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {isGenerating ? (
          <div className={styles.generating}>
            <div className={styles.generatingSpinner} />
            <p className={styles.generatingText}>Génération du rapport en cours...</p>
          </div>
        ) : generatedReport ? (
          <div className={styles.resultsContainer}>
            {generatedReport.results.map((result, idx) => {
              const indicatorConfig = report.indicators.find(i => i.id === result.indicator_id);
              const hasError = result.execution_result.error;
              
              return (
                <div key={result.indicator_id} className={styles.indicatorCard}>
                  <div className={styles.indicatorHeader}>
                    <h2 className={styles.indicatorTitle}>{result.indicator_title}</h2>
                    {hasError && <div className={styles.indicatorError}>Erreur: {result.execution_result.error}</div>}
                  </div>

                  {!hasError && result.execution_result.rows.length > 0 && (
                    <>
                      {/* Graphique si configuré */}
                      {indicatorConfig?.chart_type && (
                        <div className={styles.chartWrapper}>
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
                      <div className={styles.resultsWrapper}>
                        <table className={styles.resultsTable}>
                          <thead>
                            <tr className={styles.resultsHeaderRow}>
                              {result.execution_result.columns.map((col) => (
                                <th key={col} className={styles.resultsHeaderCell}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {result.execution_result.rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className={styles.resultsRowHover}>
                                {result.execution_result.columns.map((col) => (
                                  <td key={col} className={styles.resultsCell} title={formatCellValue(row[col])}>
                                    {formatCellValue(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className={styles.resultsCount}>{result.execution_result.row_count} ligne{result.execution_result.row_count > 1 ? 's' : ''}</div>
                    </>
                  )}

                  {!hasError && result.execution_result.rows.length === 0 && (
                    <div className={styles.emptyResult}>
                      <p className={styles.emptyResultText}>Aucun résultat retourné par cet indicateur</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.noGenerated}>
            <p className={styles.noGeneratedTitle}>Aucun résultat généré</p>
            <p className={styles.noGeneratedSubtitle}>Cliquez sur "Générer le rapport" pour exécuter tous les indicateurs et afficher les résultats</p>
            <button onClick={generateReport} className="btn btn-success">Générer le rapport</button>
          </div>
        )}

        <div className={styles.footerActions}>
          <button onClick={() => navigate('/reports')} className="btn btn-secondary">Retour à la liste</button>
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
