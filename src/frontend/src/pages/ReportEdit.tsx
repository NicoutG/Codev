import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { reportsApi, Report, ReportUpdate, ReportIndicatorConfig } from '../api/reports';
import { indicatorsApi, Indicator } from '../api/indicators';
import { commonStyles } from '../styles/common';
import { pageStyles } from '../styles/pages';
import styles from '../styles/pages/ReportEdit.module.css';

const chartTypes = [
  { value: null, label: 'Aucun graphique' },
  { value: 'bar', label: 'Barres' },
  { value: 'line', label: 'Ligne' },
  { value: 'pie', label: 'Circulaire' },
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
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Chargement du rapport...</p>
        </div>
      </Layout>
    );
  }

  if (!report) {
    return (
      <Layout>
        <div className={styles.notFound}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Rapport introuvable</p>
          <button onClick={() => navigate('/reports')} className="btn btn-primary">Retour à la liste</button>
        </div>
      </Layout>
    );
  }

  const sortedSelected = Array.from(selectedIndicators.entries())
    .sort((a, b) => a[1].display_order - b[1].display_order);

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Éditer le rapport: {report.title}</h1>
        <p className={styles.subtitle}>Modifiez les indicateurs et configurez leurs graphiques.</p>

        {error && <div className={styles.errorBox}>{error}</div>}

        {success && <div className={styles.successBox}>{success}</div>}

        <div className={styles.field}>
          <label htmlFor="report-title" className={styles.label}>Titre du rapport <span className={styles.required}>*</span></label>
          <input id="report-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={styles.inputCustom} />
        </div>

        <div className={styles.field}>
          <label htmlFor="report-description" className={styles.label}>Description (optionnelle)</label>
          <textarea id="report-description" value={description} onChange={(e) => setDescription(e.target.value)} className={styles.textareaCustom} />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <h2 className={styles.sectionTitle}>Indicateurs sélectionnés ({selectedIndicators.size})</h2>

          {sortedSelected.length > 0 ? (
            <div className={styles.selectedList}>
              {sortedSelected.map(([indicatorId, config]) => {
                const indicator = availableIndicators.find(i => i.id === indicatorId);
                if (!indicator) return null;

                return (
                  <div key={indicatorId} className={styles.selectedItem}>
                    <div className={styles.itemHeader}>
                      <div style={{ flex: 1 }}>
                        <h3 className={styles.itemTitle}>{indicator.title}</h3>
                        {indicator.description && <p className={styles.itemDesc}>{indicator.description}</p>}
                      </div>
                      <div className={styles.itemActions}>
                        <button onClick={() => moveIndicator(indicatorId, 'up')} disabled={config.display_order === 0} className={styles.iconBtn}>↑</button>
                        <button onClick={() => moveIndicator(indicatorId, 'down')} disabled={config.display_order === sortedSelected.length - 1} className={styles.iconBtn}>↓</button>
                        <button onClick={() => toggleIndicator(indicator)} className={styles.removeBtn}>✕</button>
                      </div>
                    </div>
                    <div>
                      <label className={styles.label}>Type de graphique</label>
                      <select value={config.chart_type || ''} onChange={(e) => updateIndicatorConfig(indicatorId, { chart_type: e.target.value || null })} className={styles.smallSelect}>
                        {chartTypes.map(type => (
                          <option key={type.value || 'none'} value={type.value || ''}>{type.label}</option>
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>Indicateurs disponibles ({availableIndicators.length})</h2>
          <div className={styles.availableGrid}>
            {availableIndicators.map((indicator) => {
              const isSelected = selectedIndicators.has(indicator.id);
              return (
                <div
                  key={indicator.id}
                  onClick={() => toggleIndicator(indicator)}
                  className={`${styles.indicatorCard} ${isSelected ? styles.indicatorSelected : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className={styles.checkbox}
                    />
                    <div style={{ flex: 1 }}>
                      <h3 className={styles.indicatorTitle}>{indicator.title}</h3>
                      {indicator.description && <p className={styles.indicatorDesc}>{indicator.description}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={() => navigate(`/reports/${reportId}`)} className="btn btn-secondary">Annuler</button>
          <button onClick={handleSave} disabled={isSaving} className={`btn btn-primary ${styles.saveBtn}`}>{isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}</button>
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
