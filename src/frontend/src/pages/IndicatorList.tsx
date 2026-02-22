import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { indicatorsApi, Indicator } from '../api/indicators';
import { commonStyles } from '../styles/common';
import { pageStyles } from '../styles/pages';
import styles from '../styles/pages/IndicatorList.module.css';

const IndicatorListContent: React.FC = () => {
  const { isEditeur, user } = useAuth();
  const navigate = useNavigate();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await indicatorsApi.getAll();
      setIndicators(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des indicateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'indicateur "${title}" ? Cette action est irréversible.`)) {
      return;
    }
    try {
      setError('');
      await indicatorsApi.delete(id);
      loadIndicators();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout>
      <div>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Indicateurs</h1>
            <p className={styles.subtitle}>Gérez et visualisez vos indicateurs statistiques</p>
          </div>
          {isEditeur && (
            <Link to="/indicators/new" className={`${styles.createBtn} btn btn-primary`}>+ Créer un indicateur</Link>
          )}
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {isLoading ? (
          <div className={styles.loading}><div className={styles.spinner} /><p className={styles.loadingText}>Chargement des indicateurs...</p></div>
        ) : indicators.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIcon}>📊</div>
            <p className={styles.emptyTitle}>Aucun indicateur pour le moment</p>
            {isEditeur && <p className={styles.emptySub}>Créez votre premier indicateur pour commencer</p>}
          </div>
        ) : (
          <div className={styles.listCard}>
            <div className={styles.listInner}>
              {indicators.map((indicator) => (
                <div key={indicator.id} className={styles.listItem} onClick={() => navigate(`/indicators/${indicator.id}`)}>
                  <div className={styles.itemRow}>
                    <div style={{ flex: 1 }}>
                      <h3 className={styles.itemTitle}>{indicator.title}</h3>
                      {indicator.description && <p className={styles.itemDesc}>{indicator.description}</p>}
                      <div className={styles.itemMeta}>
                        <span>Créé le {formatDate(indicator.created_at)}</span>
                        {indicator.updated_at && indicator.updated_at !== indicator.created_at && (<span>Modifié le {formatDate(indicator.updated_at)}</span>)}
                      </div>
                    </div>
                    <div className={styles.itemActions}>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/indicators/${indicator.id}`); }} className={`${styles.actionBtn} ${styles.viewBtn}`}>Voir</button>
                      {isEditeur && (
                        <>
                          <button onClick={(e) => { e.stopPropagation(); navigate(`/indicators/${indicator.id}/edit`); }} className={`${styles.actionBtn} ${styles.editBtn}`}>Modifier</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(indicator.id, indicator.title); }} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Supprimer</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default function IndicatorList() {
  return (
    <ProtectedRoute>
      <IndicatorListContent />
    </ProtectedRoute>
  );
}
