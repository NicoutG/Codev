import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { indicatorsApi, Indicator } from '../api/indicators';

const IndicatorViewContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isEditeur } = useAuth();
  const navigate = useNavigate();
  const [indicator, setIndicator] = useState<Indicator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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
          <p style={{ color: '#64748b' }}>Chargement de l'indicateur...</p>
        </div>
      </Layout>
    );
  }

  if (error || !indicator) {
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
            {error || 'Indicateur introuvable'}
          </p>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#1e40af',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.9375rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1e3a8a';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1e40af';
            }}
          >
            Retour à la liste
          </button>
        </div>
      </Layout>
    );
  }

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
              {indicator.title}
            </h1>
            {indicator.description && (
              <p style={{
                fontSize: '0.9375rem',
                color: '#64748b',
                marginBottom: '1rem',
                lineHeight: '1.6'
              }}>
                {indicator.description}
              </p>
            )}
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              fontSize: '0.8125rem',
              color: '#94a3b8'
            }}>
              <span>Créé le {formatDate(indicator.created_at)}</span>
              {indicator.updated_at && indicator.updated_at !== indicator.created_at && (
                <span>Modifié le {formatDate(indicator.updated_at)}</span>
              )}
            </div>
          </div>
          {isEditeur && (
            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => navigate(`/indicators/${indicator.id}/edit`)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#10b981';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Modifier
              </button>
            </div>
          )}
        </div>

        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          border: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            Configuration de l'indicateur
          </h2>
          <pre style={{
            backgroundColor: '#f8fafc',
            padding: '1.5rem',
            borderRadius: '8px',
            overflow: 'auto',
            fontSize: '0.875rem',
            lineHeight: '1.6',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            maxHeight: '600px'
          }}>
            {JSON.stringify(indicator.indicator, null, 2)}
          </pre>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={() => navigate('/')}
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

export default function IndicatorView() {
  return (
    <ProtectedRoute>
      <IndicatorViewContent />
    </ProtectedRoute>
  );
}
