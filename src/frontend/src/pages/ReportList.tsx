import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { reportsApi, Report } from '../api/reports';
import { commonStyles } from '../styles/common';
import styles from '../styles/pages/ReportList.module.css';

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
        <div className={commonStyles.loadingContainer as any}>
          <div className={commonStyles.loadingSpinner as any} />
          <p className={styles.loadingText}>Chargement des rapports...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Rapports</h1>
            <p className={styles.subtitle}>Gérez vos rapports d'indicateurs</p>
          </div>
          {(isEditeur || isAdmin) && (
            <Link to="/reports/new" className={styles.createLink}>+ Créer un rapport</Link>
          )}
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        {reports.length === 0 ? (
          <div className={styles.emptyCard}>
            <p className={styles.emptyTitle}>Aucun rapport pour le moment</p>
            {(isEditeur || isAdmin) && <p className={styles.emptySubtitle}>Créez votre premier rapport pour commencer</p>}
          </div>
        ) : (
          <div className={styles.grid}>
            {reports.map((report) => (
              <div key={report.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{report.title}</h3>
                  <p className={styles.cardDesc}>{report.description || 'Pas de description.'}</p>
                  <div className={styles.cardInfo}>{report.indicators.length} indicateur{report.indicators.length > 1 ? 's' : ''}</div>
                </div>
                <div className={styles.cardActions}>
                  <Link to={`/reports/${report.id}`} className={`${styles.actionLink} ${styles.viewLink}`}>Voir</Link>
                  {(isEditeur || isAdmin) && (
                    <>
                      <Link to={`/reports/${report.id}/edit`} className={`${styles.actionLink} ${styles.editLink}`}>Modifier</Link>
                      <button onClick={() => handleDelete(report.id)} className={styles.deleteBtn}>Supprimer</button>
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
