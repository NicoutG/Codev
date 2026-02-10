import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { reportsApi, Report, ReportUpdate, ReportIndicatorConfig } from '../api/reports';
import { indicatorsApi, Indicator } from '../api/indicators';
import { commonStyles } from '../styles/common';
import { pageStyles } from '../styles/pages';

const chartTypes = [
  { value: null, label: 'Aucun graphique' },
  { value: 'bar', label: 'Barres' },
  { value: 'line', label: 'Ligne' },
  { value: 'pie', label: 'Camembert' },
  { value: 'area', label: 'Aire' }
];

const ReportEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const reportId = id ? parseInt(id) : null;
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [availableIndicators, setAvailableIndicators] = useState<Indicator[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<Map<number, ReportIndicatorConfig>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (reportId) {
      loadReport();
      loadIndicators();
    }
  }, [reportId]);

  const loadReport = async () => {
    if (!reportId) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await reportsApi.getById(reportId);
      setReport(data);
      setTitle(data.title);
      setDescription(data.description || '');
      
      // Initialiser les indicateurs sélectionnés avec leur config
      const selected = new Map<number, ReportIndicatorConfig>();
      data.indicators.forEach(ind => {
        selected.set(ind.id, {
          indicator_id: ind.id,
          chart_type: ind.chart_type || null,
          chart_config: ind.chart_config || null,
          display_order: ind.display_order
        });
      });
      setSelectedIndicators(selected);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement du rapport');
    } finally {
      setIsLoading(false);
    }
  };

  const loadIndicators = async () => {
    try {
      const data = await indicatorsApi.getAll();
      setAvailableIndicators(data);
    } catch (err: any) {
      // Erreur silencieuse, on continue
    }
  };

  const toggleIndicator = (indicator: Indicator) => {
    const newSelected = new Map(selectedIndicators);
    if (newSelected.has(indicator.id)) {
      newSelected.delete(indicator.id);
    } else {
      newSelected.set(indicator.id, {
        indicator_id: indicator.id,
        chart_type: null,
        chart_config: null,
        display_order: newSelected.size
      });
    }
    setSelectedIndicators(newSelected);
  };

  const updateIndicatorConfig = (indicatorId: number, config: Partial<ReportIndicatorConfig>) => {
    const newSelected = new Map(selectedIndicators);
    const existing = newSelected.get(indicatorId);
    if (existing) {
      newSelected.set(indicatorId, { ...existing, ...config });
      setSelectedIndicators(newSelected);
    }
  };

  const moveIndicator = (indicatorId: number, direction: 'up' | 'down') => {
    const newSelected = new Map(selectedIndicators);
    const config = newSelected.get(indicatorId);
    if (!config) return;

    const sorted = Array.from(newSelected.entries()).sort((a, b) => a[1].display_order - b[1].display_order);
    const currentIndex = sorted.findIndex(([id]) => id === indicatorId);
    
    if (direction === 'up' && currentIndex > 0) {
      const prevConfig = sorted[currentIndex - 1][1];
      config.display_order = prevConfig.display_order;
      prevConfig.display_order = currentIndex;
      newSelected.set(sorted[currentIndex - 1][0], prevConfig);
      newSelected.set(indicatorId, config);
    } else if (direction === 'down' && currentIndex < sorted.length - 1) {
      const nextConfig = sorted[currentIndex + 1][1];
      config.display_order = nextConfig.display_order;
      nextConfig.display_order = currentIndex + 2;
      newSelected.set(sorted[currentIndex + 1][0], nextConfig);
      newSelected.set(indicatorId, config);
    }
    
    setSelectedIndicators(newSelected);
  };

  const handleSave = async () => {
    if (!reportId) return;
    if (!title.trim()) {
      setError('Le titre du rapport est requis.');
      return;
    }
    if (selectedIndicators.size === 0) {
      setError('Veuillez sélectionner au moins un indicateur.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const indicatorConfigs = Array.from(selectedIndicators.values());
      const reportData: ReportUpdate = {
        title: title.trim(),
        description: description.trim() || undefined,
        indicator_configs: indicatorConfigs
      };

      await reportsApi.update(reportId, reportData);
      setSuccess(`Rapport "${title}" mis à jour avec succès !`);
      setTimeout(() => {
        navigate(`/reports/${reportId}`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour du rapport');
    } finally {
      setIsSaving(false);
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
          <p style={{ color: '#64748b' }}>Chargement du rapport...</p>
        </div>
      </Layout>
    );
  }

  if (!report) {
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
            Rapport introuvable
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

  const sortedSelected = Array.from(selectedIndicators.entries())
    .sort((a, b) => a[1].display_order - b[1].display_order);

  return (
    <Layout>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        border: '1px solid #e2e8f0',
        padding: '2rem'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1e293b',
          marginBottom: '0.5rem',
          letterSpacing: '-0.02em'
        }}>
          Éditer le rapport: {report.title}
        </h1>
        <p style={{
          fontSize: '0.9375rem',
          color: '#64748b',
          marginBottom: '2rem'
        }}>
          Modifiez les indicateurs et configurez leurs graphiques.
        </p>

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

        {success && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            color: '#166534',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}

        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="report-title" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155', fontSize: '0.9375rem' }}>
            Titre du rapport <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            id="report-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '1rem',
              backgroundColor: '#f8fafc',
              color: '#334155',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label htmlFor="report-description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155', fontSize: '0.9375rem' }}>
            Description (optionnelle)
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '1rem',
              backgroundColor: '#f8fafc',
              color: '#334155',
              minHeight: '80px',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            Indicateurs sélectionnés ({selectedIndicators.size})
          </h2>

          {sortedSelected.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {sortedSelected.map(([indicatorId, config]) => {
                const indicator = availableIndicators.find(i => i.id === indicatorId);
                if (!indicator) return null;

                return (
                  <div
                    key={indicatorId}
                    style={{
                      padding: '1.25rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: '1rem',
                          fontWeight: '600',
                          color: '#1e293b',
                          marginBottom: '0.25rem'
                        }}>
                          {indicator.title}
                        </h3>
                        {indicator.description && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#64748b'
                          }}>
                            {indicator.description}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => moveIndicator(indicatorId, 'up')}
                          disabled={config.display_order === 0}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: config.display_order === 0 ? '#f1f5f9' : 'white',
                            color: config.display_order === 0 ? '#94a3b8' : '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: config.display_order === 0 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveIndicator(indicatorId, 'down')}
                          disabled={config.display_order === sortedSelected.length - 1}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: config.display_order === sortedSelected.length - 1 ? '#f1f5f9' : 'white',
                            color: config.display_order === sortedSelected.length - 1 ? '#94a3b8' : '#64748b',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: config.display_order === sortedSelected.length - 1 ? 'not-allowed' : 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => toggleIndicator(indicator)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#334155', fontSize: '0.875rem' }}>
                        Type de graphique
                      </label>
                      <select
                        value={config.chart_type || ''}
                        onChange={(e) => updateIndicatorConfig(indicatorId, { chart_type: e.target.value || null })}
                        style={{
                          width: '100%',
                          padding: '0.625rem 0.75rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          backgroundColor: 'white',
                          color: '#334155'
                        }}
                      >
                        {chartTypes.map(type => (
                          <option key={type.value || 'none'} value={type.value || ''}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{
              padding: '2rem',
              textAlign: 'center',
              color: '#94a3b8',
              backgroundColor: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              Aucun indicateur sélectionné. Sélectionnez des indicateurs ci-dessous.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            Indicateurs disponibles ({availableIndicators.length})
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1rem',
            maxHeight: '400px',
            overflowY: 'auto',
            padding: '0.5rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            {availableIndicators.map((indicator) => {
              const isSelected = selectedIndicators.has(indicator.id);
              return (
                <div
                  key={indicator.id}
                  onClick={() => toggleIndicator(indicator)}
                  style={{
                    padding: '1rem',
                    backgroundColor: isSelected ? '#eff6ff' : 'white',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid #1e40af' : '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                      e.currentTarget.style.borderColor = '#cbd5e1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{
                        marginTop: '0.25rem',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        color: '#1e293b',
                        marginBottom: '0.25rem'
                      }}>
                        {indicator.title}
                      </h3>
                      {indicator.description && (
                        <p style={{
                          fontSize: '0.8125rem',
                          color: '#64748b'
                        }}>
                          {indicator.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{
          marginTop: '3rem',
          paddingTop: '2rem',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={() => navigate(`/reports/${reportId}`)}
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
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '0.75rem 2rem',
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1.0625rem',
              fontWeight: '600',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = '#1e3a8a';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 64, 175, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving) {
                e.currentTarget.style.backgroundColor = '#1e40af';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 64, 175, 0.3)';
              }
            }}
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default function ReportEdit() {
  return (
    <ProtectedRoute requiredRole="editeur">
      <ReportEditContent />
    </ProtectedRoute>
  );
}
