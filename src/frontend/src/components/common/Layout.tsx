import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAdmin, isConsultant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      consultant_rapport: 'Consultant Rapport',
      consultant: 'Consultant',
      editeur: 'Éditeur',
      admin: 'Administrateur'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      consultant_rapport: '#64748b',
      consultant: '#64748b',
      editeur: '#3b82f6',
      admin: '#1e40af'
    };
    return colors[role] || '#64748b';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '70px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
            <Link to="/" style={{
              fontSize: '1.25rem',
              fontWeight: '700',
              color: '#1e40af',
              textDecoration: 'none',
              letterSpacing: '-0.02em'
            }}>
              Polytech Lyon
            </Link>
            <nav style={{ display: 'flex', gap: '0.5rem' }}>
              <Link
                to="/"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  color: isActive('/') ? '#1e40af' : '#64748b',
                  backgroundColor: isActive('/') ? '#eff6ff' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                Indicateurs
              </Link>
              {isConsultant && (
              <Link
                to="/database"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  color: isActive('/database') ? '#1e40af' : '#64748b',
                  backgroundColor: isActive('/database') ? '#eff6ff' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                Base de données
              </Link>
              )}
              <Link
                to="/reports"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  color: isActive('/reports') ? '#1e40af' : '#64748b',
                  backgroundColor: isActive('/reports') ? '#eff6ff' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                Rapports
              </Link>
              {isAdmin && (
                <Link
                  to="/users"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '0.9375rem',
                    fontWeight: '500',
                    color: isActive('/users') ? '#1e40af' : '#64748b',
                    backgroundColor: isActive('/users') ? '#eff6ff' : 'transparent',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Utilisateurs
                </Link>
              )}
              <Link
                to="/change-password"
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontSize: '0.9375rem',
                  fontWeight: '500',
                  color: isActive('/change-password') ? '#1e40af' : '#64748b',
                  backgroundColor: isActive('/change-password') ? '#eff6ff' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                Mot de passe
              </Link>
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e40af',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}>
                {user?.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
                  {user?.username}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: getRoleColor(user?.role || ''),
                  fontWeight: '500'
                }}>
                  {getRoleLabel(user?.role || '')}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.625rem 1.25rem',
                backgroundColor: '#f1f5f9',
                color: '#64748b',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
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
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      <main style={{
        flex: 1,
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {children}
      </main>
    </div>
  );
};
