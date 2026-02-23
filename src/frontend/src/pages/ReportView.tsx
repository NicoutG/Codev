import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { reportsApi, Report, ReportGenerateResponse } from '../api/reports';
import { apiClient } from '../api/client';
import { Chart } from '../components/charts/Chart';
import { commonStyles } from '../styles/common';
import styles from '../styles/pages/ReportView.module.css';
import html2pdf from 'html2pdf.js';
import html2canvas from 'html2canvas';

const exportFormats = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel (XLSX)' },
  { value: 'pdf', label: 'PDF' }

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState('');
  const pdfContainerRef = useRef<HTMLDivElement>(null);

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

  const generatePdfExport = async () => {
    if (!report || !generatedReport || !pdfContainerRef.current) {
      setError('Impossible de générer le PDF');
      return;
    }
    //Date 
    try {
      setIsGeneratingPdf(true);
      const today = new Date();
      const dateStr = today.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const element = document.createElement('div');
      element.style.padding = '40px';
      element.style.backgroundColor = 'white';
      element.style.fontFamily = 'Arial, sans-serif';

      // Header avec titre et date
      const header = document.createElement('div');
      header.style.marginBottom = '30px';
      header.style.borderBottom = '2px solid #e2e8f0';
      header.style.paddingBottom = '20px';
      
      const title = document.createElement('h1');
      title.textContent = report.title;
      title.style.margin = '0 0 10px 0';
      title.style.fontSize = '28px';
      title.style.color = '#1e293b';
      
      const description = document.createElement('p');
      description.textContent = report.description || '';
      description.style.margin = '10px 0';
      description.style.color = '#64748b';
      description.style.fontSize = '14px';
      
      const dateElement = document.createElement('p');
      dateElement.textContent = `Date: ${dateStr}`;
      dateElement.style.margin = '10px 0 0 0';
      dateElement.style.color = '#94a3b8';
      dateElement.style.fontSize = '12px';
      dateElement.style.fontWeight = 'bold';
      
      header.appendChild(title);
      if (report.description) header.appendChild(description);
      header.appendChild(dateElement);
      element.appendChild(header);

      // Ajouter les résultats avec charts
      for (const result of generatedReport.results) {
        const indicatorConfig = report.indicators.find(i => i.id === result.indicator_id);
        const hasError = result.execution_result.error;

        const section = document.createElement('div');
        section.style.marginBottom = '40px';
        section.style.pageBreakInside = 'avoid';

        const indicatorTitle = document.createElement('h2');
        indicatorTitle.textContent = result.indicator_title;
        indicatorTitle.style.fontSize = '20px';
        indicatorTitle.style.color = '#1e293b';
        indicatorTitle.style.marginBottom = '15px';
        indicatorTitle.style.borderBottom = '2px solid #e2e8f0';
        indicatorTitle.style.paddingBottom = '10px';
        section.appendChild(indicatorTitle);

        if (hasError) {
          const errorDiv = document.createElement('div');
          errorDiv.style.padding = '15px';
          errorDiv.style.backgroundColor = '#fef2f2';
          errorDiv.style.color = '#991b1b';
          errorDiv.style.borderRadius = '6px';
          errorDiv.style.fontSize = '14px';
          errorDiv.textContent = `Erreur: ${result.execution_result.error}`;
          section.appendChild(errorDiv);
        } else if (result.execution_result.rows.length > 0) {
          // Ajouter le graphique d'abord (AVANT le tableau)
          let chartContainer = null;
          if (indicatorConfig?.chart_type) {
            chartContainer = document.createElement('div');
            chartContainer.style.marginBottom = '20px';
            chartContainer.style.pageBreakInside = 'avoid';
            chartContainer.style.maxWidth = '100%';
            chartContainer.style.overflow = 'visible';
            chartContainer.style.display = 'flex';
            chartContainer.style.justifyContent = 'center';
            chartContainer.style.alignItems = 'center';
            chartContainer.style.height = 'auto';
            chartContainer.style.minHeight = '250px';

            const chartCanvas = pdfContainerRef.current.querySelector(
              `[data-chart-id="${result.indicator_id}"]`
            ) as HTMLElement;

            if (chartCanvas) {
              try {
                // Capture the visible chart area as an image, conserve ratio
                // eslint-disable-next-line no-await-in-loop
                const canvas = await html2canvas(chartCanvas, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/png');
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.maxHeight = '280px';
                img.style.objectFit = 'contain';
                img.style.display = 'block';
                chartContainer.appendChild(img);
              } catch (e) {
                // fallback to cloning if capture fails
                const clonedChart = chartCanvas.cloneNode(true) as HTMLElement;
                clonedChart.style.width = '100%';
                clonedChart.style.height = '280px';
                clonedChart.style.overflow = 'visible';
                chartContainer.appendChild(clonedChart);
              }
            }
            section.appendChild(chartContainer);
          }

          // Ajouter le tableau APRES le graphique
          const table = document.createElement('table');
          table.style.width = '100%';
          table.style.borderCollapse = 'collapse';
          table.style.fontSize = '12px';
          table.style.marginTop = '15px';

          const thead = document.createElement('thead');
          const headerRow = document.createElement('tr');
          headerRow.style.backgroundColor = '#f8fafc';
          headerRow.style.borderBottom = '2px solid #e2e8f0';

          result.execution_result.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            th.style.padding = '10px';
            th.style.textAlign = 'left';
            th.style.fontWeight = 'bold';
            th.style.color = '#64748b';
            headerRow.appendChild(th);
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);

          const tbody = document.createElement('tbody');
          result.execution_result.rows.forEach((row, rowIdx) => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #e2e8f0';
            if (rowIdx % 2 === 0) {
              tr.style.backgroundColor = '#f8fafc';
            }

            result.execution_result.columns.forEach(col => {
              const td = document.createElement('td');
              td.textContent = formatCellValue(row[col]);
              td.style.padding = '10px';
              td.style.color = '#1e293b';
              tr.appendChild(td);
            });
            tbody.appendChild(tr);
          });
          table.appendChild(tbody);
          section.appendChild(table);

          const rowCount = document.createElement('p');
          rowCount.textContent = `${result.execution_result.row_count} ligne${result.execution_result.row_count > 1 ? 's' : ''}`;
          rowCount.style.marginTop = '10px';
          rowCount.style.fontSize = '12px';
          rowCount.style.color = '#64748b';
          rowCount.style.textAlign = 'right';
          section.appendChild(rowCount);

          // Page break APRES la légende (rowCount), pas sur le graphique
          section.style.pageBreakAfter = 'always';
        } else {
          const empty = document.createElement('p');
          empty.textContent = 'Aucun résultat retourné par cet indicateur';
          empty.style.color = '#64748b';
          empty.style.fontStyle = 'italic';
          section.appendChild(empty);
        }

        element.appendChild(section);
      }

      // Générer le PDF
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `rapport_${report.id}_${today.toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };

      html2pdf().set(opt).from(element).save();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération du PDF');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExport = async (format: string) => {
    // Route vers l'export PDF personnalisé
    if (format === 'pdf') {
      setIsGeneratingPdf(true);
      try {
        await generatePdfExport();
      } finally {
        setIsGeneratingPdf(false);
      }
      return;
    }

    if (!reportId) return;
    try {
      const response = await apiClient.get(`/api/v1/reports/${reportId}/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
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
          <p className={styles.errorText}>{error}</p>
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
          <div className={styles.flex1}>
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
              <div className={styles.rowGap}>
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

        {isGeneratingPdf && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}>
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <div style={{
                display: 'inline-block',
                width: '50px',
                height: '50px',
                border: '4px solid #e2e8f0',
                borderTopColor: '#1e40af',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '1rem'
              }} />
              <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Génération du PDF en cours...</p>
            </div>
          </div>
        )}

        {isGenerating ? (
          <div className={styles.generating}>
            <div className={styles.generatingSpinner} />
            <p className={styles.generatingText}>Génération du rapport en cours...</p>
          </div>
        ) : generatedReport ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }} ref={pdfContainerRef}>
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
                        <div style={{ marginBottom: '2rem', width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{indicatorConfig.chart_type.toUpperCase()}</div>
                            <div>
                              <button
                                onClick={async () => {
                                  try {
                                    const chartNode = document.querySelector(`[data-chart-id="${result.indicator_id}"]`) as HTMLElement;
                                    if (!chartNode) return;
                                    const canvas = await html2canvas(chartNode, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                                    const url = canvas.toDataURL('image/png');
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `${result.indicator_title.replace(/[^a-z0-9_-]/gi, '_') || 'chart'}.png`;
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                style={{
                                  padding: '6px 10px',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  backgroundColor: 'white',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem'
                                }}
                              >
                                Télécharger l'image
                              </button>
                            </div>
                          </div>

                          <div 
                            style={{ 
                              marginBottom: '0.5rem',
                              width: '100%',
                              maxWidth: '100%',
                              display: 'flex',
                              justifyContent: 'center'
                            }}
                            data-chart-id={result.indicator_id}
                          >
                            <div style={{ width: '100%', maxWidth: '100%' }}>
                              <Chart
                                type={indicatorConfig.chart_type as 'bar' | 'line' | 'pie' | 'area'}
                                data={result.execution_result.rows}
                                columns={result.execution_result.columns}
                                title={result.indicator_title}
                                config={indicatorConfig.chart_config}
                              />
                            </div>
                          </div>
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
