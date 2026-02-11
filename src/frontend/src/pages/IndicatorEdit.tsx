import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SubjectProvider } from '../contexts/SubjectContext';
import SubjectBlock from '../components/blocks/SubjectBlock';
import ColumnBlock from '../components/blocks/ColumnBlock';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { indicatorsApi, IndicatorUpdate } from '../api/indicators';
import { commonStyles } from '../styles/common';
import { pageStyles } from '../styles/pages';

interface ExecutionResult {
  sql: string;
  columns: string[];
  rows: any[];
  row_count: number;
  indicator_title: string;
}

const IndicatorEditContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState<any>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState('');
  const [showJson, setShowJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) loadIndicator();
  }, [id]);

  const loadIndicator = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await indicatorsApi.getById(parseInt(id!));
      setIndicator({
        title: data.title,
        description: data.description || '',
        sujet: data.indicator?.sujet || { tables: [], conditions: null },
        colonnes: data.indicator?.colonnes || []
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement de l\'indicateur');
    } finally {
      setIsLoading(false);
    }
  };

  const exportJson = {
    sujet: indicator?.sujet || { tables: [], conditions: null },
    colonnes: indicator?.colonnes || []
  };

  // --- Colonnes ---
  function addColumn() {
    setIndicator({
      ...indicator,
      colonnes: [
        ...indicator.colonnes,
        { type: 'group_by', titre: 'Nouvelle colonne', expr: { col: '' } }
      ]
    });
  }

  function updateColumn(index: number, newCol: any) {
    const cols = [...indicator.colonnes];
    cols[index] = newCol;
    setIndicator({ ...indicator, colonnes: cols });
  }

  function deleteColumn(index: number) {
    setIndicator({
      ...indicator,
      colonnes: indicator.colonnes.filter((_, i) => i !== index)
    });
  }

  function moveColumnUp(index: number) {
    if (index === 0) return;
    const cols = [...indicator.colonnes];
    [cols[index - 1], cols[index]] = [cols[index], cols[index - 1]];
    setIndicator({ ...indicator, colonnes: cols });
  }

  function moveColumnDown(index: number) {
    if (index === indicator.colonnes.length - 1) return;
    const cols = [...indicator.colonnes];
    [cols[index + 1], cols[index]] = [cols[index], cols[index + 1]];
    setIndicator({ ...indicator, colonnes: cols });
  }

  // --- JSON Import/Export ---
  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setIndicator({
          ...indicator,
          sujet: json.sujet ?? { tables: [], conditions: null },
          colonnes: json.colonnes ?? []
        });
        setError('');
      } catch {
        setError('Fichier JSON invalide');
      }
    };
    reader.readAsText(file);
  }

  function exportToFile() {
    if (!indicator?.title) {
      setError('Le titre est requis pour exporter le fichier');
      return;
    }
    const blob = new Blob([JSON.stringify(exportJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${indicator.title}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Exécution ---
  const handleExecute = async () => {
    if (!indicator?.sujet?.tables?.length) {
      setExecutionError('Veuillez sélectionner au moins une table dans le sujet');
      return;
    }
    if (!indicator?.colonnes?.length) {
      setExecutionError('Veuillez ajouter au moins une colonne');
      return;
    }

    try {
      setIsExecuting(true);
      setExecutionError('');
      setExecutionResult(null);
      const result = await indicatorsApi.executeJson(exportJson);
      setExecutionResult(result);
    } catch (err: any) {
      setExecutionError(err.response?.data?.detail || 'Erreur lors de l\'exécution de l\'indicateur');
    } finally {
      setIsExecuting(false);
    }
  };

  // --- Sauvegarde ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!indicator?.title?.trim()) {
      setError('Le titre est requis');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      const data: IndicatorUpdate = {
        title: indicator.title,
        description: indicator.description || undefined,
        indicator: exportJson
      };
      await indicatorsApi.update(parseInt(id!), data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la mise à jour de l\'indicateur');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={commonStyles.loadingContainer}>
          <div style={commonStyles.loadingSpinner} />
          <p style={{ color: '#64748b' }}>Chargement de l'indicateur...</p>
        </div>
      </Layout>
    );
  }

  if (!indicator) {
    return (
      <Layout>
        <div style={{ ...commonStyles.card, textAlign: 'center' }}>
          <p style={{ color: '#64748b' }}>Indicateur introuvable</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SubjectProvider sujet={indicator.sujet} setSujet={(sujet) => setIndicator({ ...indicator, sujet })}>
        <div>
          <div style={commonStyles.pageHeader}>
            <h1 style={commonStyles.pageTitle}>Modifier l'indicateur</h1>
            <p style={commonStyles.pageSubtitle}>Modifiez les paramètres de l'indicateur</p>
          </div>

          {error && <div style={commonStyles.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* --- Titre & description --- */}
            <div style={pageStyles.indicator.formSection}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={commonStyles.label}>
                  Titre de l'indicateur <span style={commonStyles.labelRequired}>*</span>
                </label>
                <input
                  type="text"
                  value={indicator.title}
                  onChange={(e) => setIndicator({ ...indicator, title: e.target.value })}
                  required
                  placeholder="Ex: Taux d'insertion par promotion"
                  style={commonStyles.input}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={commonStyles.label}>Description (optionnelle)</label>
                <textarea
                  value={indicator.description}
                  onChange={(e) => setIndicator({ ...indicator, description: e.target.value })}
                  placeholder="Décrivez l'indicateur..."
                  rows={3}
                  style={commonStyles.textarea}
                />
              </div>

              {/* Import / Export JSON */}
              <div style={pageStyles.indicator.importExportButtons}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...commonStyles.buttonSmall, ...commonStyles.buttonSecondary }}>
                  📁 Importer un JSON
                </button>
                <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
                <button type="button" onClick={exportToFile} style={{ ...commonStyles.buttonSmall, ...commonStyles.buttonSecondary }}>
                  💾 Exporter le JSON
                </button>
              </div>
            </div>

            {/* --- Sujet --- */}
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>Sujet</h2>
              <SubjectBlock value={indicator.sujet} onChange={(sujet) => setIndicator({ ...indicator, sujet })} />
            </div>

            {/* --- Colonnes --- */}
            <div style={pageStyles.indicator.formSection}>
              <div style={pageStyles.indicator.sectionHeader}>
                <h2 style={pageStyles.indicator.sectionTitle}>Colonnes</h2>
                <button type="button" onClick={addColumn} style={pageStyles.indicator.addColumnButton}>+ Ajouter une colonne</button>
              </div>

              {indicator.colonnes.length === 0 ? (
                <p style={pageStyles.indicator.emptyColumns}>Aucune colonne définie. Ajoutez-en une pour commencer.</p>
              ) : (
                indicator.colonnes.map((col: any, i: number) => (
                  <div key={i} style={{ ...pageStyles.indicator.columnItem, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ColumnBlock value={col} onChange={(newCol) => updateColumn(i, newCol)} onDelete={() => deleteColumn(i)} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button type="button" onClick={() => moveColumnUp(i)} disabled={i === 0} style={{ cursor: i === 0 ? 'not-allowed' : 'pointer' }}>⬆️</button>
                      <button type="button" onClick={() => moveColumnDown(i)} disabled={i === indicator.colonnes.length - 1} style={{ cursor: i === indicator.colonnes.length - 1 ? 'not-allowed' : 'pointer' }}>⬇️</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* --- Résultats d'exécution --- */}
            {(executionResult || executionError) && (
              <div style={pageStyles.indicator.executionResult}>
                <h2 style={pageStyles.indicator.sectionTitle}>Résultats de l'exécution</h2>
                {executionError && <div style={commonStyles.errorMessage}>{executionError}</div>}
                {executionResult && (
                  <div>
                    <pre style={pageStyles.indicator.sqlPreview}>{executionResult.sql}</pre>
                    <p>
                      <strong>{executionResult.row_count}</strong> ligne{executionResult.row_count > 1 ? 's' : ''}
                    </p>
                    {executionResult.rows.length > 0 && (
                      <div style={commonStyles.tableContainer}>
                        <table style={commonStyles.table}>
                          <thead>
                            <tr style={commonStyles.tableHeader}>
                              {executionResult.columns.map((col, idx) => (
                                <th key={idx} style={commonStyles.tableHeaderCell}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {executionResult.rows.slice(0, 50).map((row, rowIdx) => (
                              <tr key={rowIdx} style={commonStyles.tableRow}>
                                {executionResult.columns.map((col, colIdx) => (
                                  <td key={colIdx} style={commonStyles.tableCell}>
                                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* --- JSON généré --- */}
            <div style={pageStyles.indicator.formSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h2 style={pageStyles.indicator.sectionTitle}>JSON généré</h2>
                <button type="button" onClick={() => setShowJson((v) => !v)} style={{ ...commonStyles.buttonSmall, ...commonStyles.buttonSecondary }}>
                  {showJson ? '🙈 Masquer' : '👀 Afficher'}
                </button>
              </div>
              {showJson && (
                <pre style={{
                  background: '#0f172a',
                  color: '#e5e7eb',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  overflowX: 'auto',
                  maxHeight: '400px'
                }}>
                  {JSON.stringify(exportJson, null, 2)}
                </pre>
              )}
            </div>

            {/* --- Actions --- */}
            <div style={pageStyles.indicator.actionButtons}>
              <button
                type="button"
                onClick={handleExecute}
                disabled={isExecuting || !indicator?.sujet?.tables?.length || !indicator?.colonnes?.length}
                style={commonStyles.buttonSuccess}
              >
                {isExecuting ? '⏳ Exécution...' : '▶️ Tester l\'indicateur'}
              </button>
              <button type="button" onClick={() => navigate('/')} style={commonStyles.buttonSecondary}>Annuler</button>
              <button type="submit" disabled={isSaving} style={commonStyles.buttonPrimary}>
                {isSaving ? 'Sauvegarde en cours...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </SubjectProvider>
    </Layout>
  );
};

export default function IndicatorEdit() {
  return (
    <ProtectedRoute requiredRole="editeur">
      <IndicatorEditContent />
    </ProtectedRoute>
  );
}
