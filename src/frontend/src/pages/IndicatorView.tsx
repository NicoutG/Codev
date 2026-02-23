import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { indicatorsApi, Indicator } from '../api/indicators';
import { commonStyles } from '../styles/common';
import styles from '../styles/pages/IndicatorView.module.css';

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
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Chargement de l'indicateur...</p>
        </div>
      </Layout>
    );
  }

  if (error || !indicator) {
    return (
      <Layout>
        <div className={styles.notFound}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error || 'Indicateur introuvable'}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">Retour à la liste</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>{indicator.title}</h1>
            {indicator.description && <p className={styles.subtitle}>{indicator.description}</p>}
            <div className={styles.metaRow}>
              <span>Créé le {formatDate(indicator.created_at)}</span>
              {indicator.updated_at && indicator.updated_at !== indicator.created_at && (<span>Modifié le {formatDate(indicator.updated_at)}</span>)}
            </div>
          </div>
          <div className={styles.actions}>
            <button onClick={executeIndicator} disabled={isExecuting} className="btn btn-primary">{isExecuting ? '⏳ Exécution...' : "▶️ Exécuter l'indicateur"}</button>
            {isEditeur && <button onClick={() => navigate(`/indicators/${indicator.id}/edit`)} className="btn btn-success">Modifier</button>}
          </div>
        </div>

        {/* Onglets */}
        <div className={styles.tabs}>
          <button onClick={() => setActiveTab('config')} className={`${styles.tabButton} ${activeTab === 'config' ? styles.tabButtonActive : ''}`}>Configuration</button>
          <button onClick={() => setActiveTab('results')} className={`${styles.tabButton} ${activeTab === 'results' ? styles.tabButtonActive : ''}`}>Résultats {executionResult && `(${executionResult.row_count})`}</button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'config' && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Configuration de l'indicateur</h2>
            <pre className={styles.preBlock}>{JSON.stringify(indicator.indicator, null, 2)}</pre>
          </div>
        )}

        {activeTab === 'results' && (
          <div className={styles.card}>
            {executionError && <div className={styles.notFound} style={{ marginBottom: '1rem', backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '1rem' }}>{executionError}</div>}

            {isExecuting ? (
              <div className={styles.loading} style={{ backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <div className={styles.spinner} />
                <p className={styles.loadingText}>Exécution de l'indicateur en cours...</p>
              </div>
            ) : executionResult ? (
              <>
                <div className={styles.resultHeader}>
                  <div>
                    <h2 className={styles.sectionTitle}>Résultats de l'exécution</h2>
                    <p className={styles.resultCount}>{executionResult.row_count} ligne{executionResult.row_count > 1 ? 's' : ''} retournée{executionResult.row_count > 1 ? 's' : ''}</p>
                  </div>
                </div>

                {executionResult.rows.length > 0 ? (
                  <div className={styles.tableWrap}>
                    <table className={styles.table}>
                      <thead>
                        <tr className={styles.theadRow}>
                          {executionResult.columns.map((col) => (
                            <th key={col} className={styles.th}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {executionResult.rows.map((row, idx) => (
                          <tr key={idx} className={styles.tr}>
                            {executionResult.columns.map((col) => (
                              <td key={col} className={styles.td} title={formatCellValue(row[col])}>{formatCellValue(row[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p className={styles.emptyStateText}>Aucun résultat retourné par l'indicateur</p>
                  </div>
                )}

                <details className={styles.detailsBlock}>
                  <summary className={styles.detailsSummary}>Voir la requête SQL générée</summary>
                  <pre className={styles.sqlPre}>{executionResult.sql}</pre>
                </details>
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateText}>Aucun résultat disponible</p>
                <p className={styles.emptyStateSub}>Cliquez sur "Exécuter l'indicateur" pour voir les résultats</p>
              </div>
            )}
          </div>
        )}

        <div className={styles.footerRow}>
          <button onClick={() => navigate('/')} className={styles.backButton}>Retour à la liste</button>
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
