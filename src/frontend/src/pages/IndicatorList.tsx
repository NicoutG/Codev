import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

const IndicatorListContent: React.FC = () => {
  const { isEditeur } = useAuth();

  return (
    <Layout>
      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              Indicateurs
            </h1>
            <p style={{
              fontSize: '0.9375rem',
              color: '#64748b'
            }}>
              Gérez et visualisez vos indicateurs statistiques
            </p>
          </div>
          {isEditeur && (
            <Link
              to="/indicators/new"
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#1e40af',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.9375rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e3a8a';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 64, 175, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e40af';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 64, 175, 0.3)';
              }}
            >
              + Créer un indicateur
            </Link>
          )}
        </div>
        <div style={{
          padding: '4rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            opacity: 0.3
          }}>
            📊
          </div>
          <p style={{
            fontSize: '1.125rem',
            color: '#64748b',
            marginBottom: '0.5rem'
          }}>
            Aucun indicateur pour le moment
          </p>
          {isEditeur && (
            <p style={{
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              Créez votre premier indicateur pour commencer
            </p>
          )}
        </div>
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
