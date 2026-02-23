import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SubjectProvider } from '../contexts/SubjectContext';
import SubjectBlock from '../components/blocks/SubjectBlock';
import ColumnBlock from '../components/blocks/ColumnBlock';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { indicatorsApi, IndicatorCreate as IndicatorCreateData } from '../api/indicators';
import { commonStyles } from '../styles/common';
import styles from '../styles/pages/IndicatorCreate.module.css';

interface ExecutionResult {
  sql: string;
  columns: string[];
  rows: any[];
  row_count: number;
  indicator_title: string;
}

function emptyIndicator() {
  return {
    title: '',
    description: '',
    sujet: { tables: [], conditions: null },
    colonnes: []
  };
}

const IndicatorCreateContent: React.FC = () => {
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState(emptyIndicator());
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showJson, setShowJson] = useState(false);

  /* =======================
     Colonnes
  ======================= */
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

  const exportJson = {
    sujet: indicator.sujet,
    colonnes: indicator.colonnes
  };

  /* =======================
     Import / Export JSON
  ======================= */
  function importJson(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setIndicator({
          ...emptyIndicator(),
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
    if (!indicator.title) {
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

  /* =======================
     Exécution
  ======================= */
  const handleExecute = async () => {
    if (!indicator.sujet.tables || indicator.sujet.tables.length === 0) {
      setExecutionError('Veuillez sélectionner au moins une table dans le sujet');
      return;
    }
    if (!indicator.colonnes || indicator.colonnes.length === 0) {
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

  /* =======================
     Création
  ======================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!indicator.title.trim()) {
      setError('Le titre est requis');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      const data: IndicatorCreateData = {
        title: indicator.title,
        description: indicator.description || undefined,
        indicator: exportJson
      };

      await indicatorsApi.create(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création de l\'indicateur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <SubjectProvider sujet={indicator.sujet} setSujet={(sujet) => setIndicator({ ...indicator, sujet })}>
        <div>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Créer un indicateur</h1>
            <p className={styles.pageSubtitle}>Définissez un nouvel indicateur statistique</p>
          </div>

          {error && <div style={commonStyles.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit}>
            {/* Titre et description */}
            <div className={styles.formSection}>
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

              <div className={styles.importExportButtons}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...commonStyles.buttonSmall, ...commonStyles.buttonSecondary }}>
                  📁 Importer un JSON
                </button>
                <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
                <button type="button" onClick={exportToFile} style={{ ...commonStyles.buttonSmall, ...commonStyles.buttonSecondary }}>
                  💾 Exporter le JSON
                </button>
              </div>
            </div>

            {/* Sujet */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Sujet</h2>
              <SubjectBlock value={indicator.sujet} onChange={(sujet) => setIndicator({ ...indicator, sujet })} />
            </div>

            {/* Colonnes */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Colonnes</h2>
                <button type="button" onClick={addColumn} className={styles.addColumnButton}>
                  + Ajouter une colonne
                </button>
              </div>

              {indicator.colonnes.length === 0 ? (
                <p className={styles.emptyColumns}>Aucune colonne définie. Ajoutez-en une pour commencer.</p>
              ) : (
                indicator.colonnes.map((col: any, i: number) => (
                  <div key={i} className={styles.columnItem}>
                    <ColumnBlock value={col} onChange={(newCol) => updateColumn(i, newCol)} onDelete={() => deleteColumn(i)} />
                    <div className={styles.moveButtons}>
                      <button type="button" onClick={() => moveColumnUp(i)} disabled={i === 0} className={styles.moveBtn}>⬆️</button>
                      <button type="button" onClick={() => moveColumnDown(i)} disabled={i === indicator.colonnes.length - 1} className={styles.moveBtn}>⬇️</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Résultats d'exécution */}
            {(executionResult || executionError) && (
              <div className={styles.executionResult}>
                <h2 className={styles.sectionTitle}>Résultats de l'exécution</h2>
                {executionError && <div style={commonStyles.errorMessage}>{executionError}</div>}
                {executionResult && (
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        <strong>SQL généré :</strong>
                      </p>
                      <pre className={styles.sqlPreview}>{executionResult.sql}</pre>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        <strong>{executionResult.row_count}</strong> ligne{executionResult.row_count > 1 ? 's' : ''} retournée{executionResult.row_count > 1 ? 's' : ''}
                      </p>
                    </div>

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
                        {executionResult.rows.length > 50 && (
                          <p style={{ padding: '0.75rem', fontSize: '0.8125rem', color: '#64748b', textAlign: 'center', fontStyle: 'italic' }}>
                            ... et {executionResult.rows.length - 50} ligne{executionResult.rows.length - 50 > 1 ? 's' : ''} supplémentaire{executionResult.rows.length - 50 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* JSON généré */}
            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>JSON généré</h2>
                <button type="button" onClick={() => setShowJson(v => !v)} style={{ ...commonStyles.buttonSmall, ...commonStyles.buttonSecondary }}>
                  {showJson ? '🙈 Masquer' : '👀 Afficher'}
                </button>
              </div>
              {showJson && (
                <pre className={styles.jsonPreview}>
                  {JSON.stringify(exportJson, null, 2)}
                </pre>
              )}
            </div>

            {/* Boutons d'action */}
            <div className={styles.actionButtons}>
              <button type="button" onClick={handleExecute} disabled={isExecuting || !indicator.sujet.tables?.length || !indicator.colonnes?.length} style={commonStyles.buttonSuccess}>
                {isExecuting ? '⏳ Exécution...' : '▶️ Tester l\'indicateur'}
              </button>
              <button type="button" onClick={() => navigate('/')} style={commonStyles.buttonSecondary}>Annuler</button>
              <button type="submit" disabled={isLoading} style={commonStyles.buttonPrimary}>
                {isLoading ? 'Création en cours...' : 'Créer l\'indicateur'}
              </button>
            </div>
          </form>
        </div>
      </SubjectProvider>
    </Layout>
  );
};

export default function IndicatorCreate() {
  return (
    <ProtectedRoute requiredRole="editeur">
      <IndicatorCreateContent />
    </ProtectedRoute>
  );
}
