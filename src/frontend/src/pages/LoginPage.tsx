import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur de connexion. Vérifiez vos identifiants.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#f8fafc'
    }}>
      {/* Section gauche - Formulaire */}
      <div style={{
        flex: '0 0 45%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: 'white'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px'
        }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              Connexion
            </h1>
            <p style={{
              fontSize: '0.9375rem',
              color: '#64748b'
            }}>
              Accédez à votre espace de suivi statistique
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                Nom d'utilisateur
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Entrez votre nom d'utilisateur"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  fontSize: '0.9375rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1e40af';
                  e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#1e293b',
                marginBottom: '0.5rem'
              }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Entrez votre mot de passe"
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  fontSize: '0.9375rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#1e293b',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1e40af';
                  e.target.style.boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e2e8f0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && (
              <div style={{
                marginBottom: '1.5rem',
                padding: '0.875rem 1rem',
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                fontSize: '0.875rem'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.875rem 1.5rem',
                fontSize: '0.9375rem',
                fontWeight: '600',
                backgroundColor: isLoading ? '#94a3b8' : '#1e40af',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isLoading ? 'none' : '0 4px 12px rgba(30, 64, 175, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#1e3a8a';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 64, 175, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = '#1e40af';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 64, 175, 0.3)';
                }
              }}
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>

      {/* Section droite - Illustration */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            fontSize: '3.5rem',
            fontWeight: '700',
            marginBottom: '1rem',
            letterSpacing: '-0.02em'
          }}>
            Polytech Lyon
          </div>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '500',
            marginBottom: '1rem',
            opacity: 0.95
          }}>
            Suivi Statistique
          </div>
          <div style={{
            fontSize: '1rem',
            opacity: 0.9,
            maxWidth: '400px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Outil d'analyse et de suivi de l'insertion professionnelle des diplômés
          </div>
        </div>
      </div>
    </div>
  );
};
