import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SubjectProvider } from '../contexts/SubjectContext';
import SubjectBlock from '../components/blocks/SubjectBlock';
import ColumnBlock from '../components/blocks/ColumnBlock';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { indicatorsApi, IndicatorUpdate } from '../api/indicators';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      colonnes: indicator.colonnes.filter((_, i: number) => i !== index)
    });
  }

  const exportJson = {
    sujet: indicator?.sujet || { tables: [], conditions: null },
    colonnes: indicator?.colonnes || []
  };

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

  const handleExecute = async () => {
    // Vérifier que l'indicateur a au moins une table et une colonne
    if (!indicator?.sujet?.tables || indicator.sujet.tables.length === 0) {
      setExecutionError('Veuillez sélectionner au moins une table dans le sujet');
      return;
    }
    if (!indicator?.colonnes || indicator.colonnes.length === 0) {
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

  if (!indicator) {
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
          <p style={{ color: '#64748b' }}>Indicateur introuvable</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SubjectProvider sujet={indicator.sujet} setSujet={(sujet) => setIndicator({ ...indicator, sujet })}>
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1e293b',
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em'
            }}>
              Modifier l'indicateur
            </h1>
            <p style={{
              fontSize: '0.9375rem',
              color: '#64748b'
            }}>
              Modifiez les paramètres de l'indicateur
            </p>
          </div>

          {error && (
            <div style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#1e293b',
                  marginBottom: '0.5rem'
                }}>
                  Titre de l'indicateur <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={indicator.title}
                  onChange={(e) => setIndicator({ ...indicator, title: e.target.value })}
                  required
                  placeholder="Ex: Taux d'insertion par promotion"
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
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
                  Description (optionnelle)
                </label>
                <textarea
                  value={indicator.description}
                  onChange={(e) => setIndicator({ ...indicator, description: e.target.value })}
                  placeholder="Décrivez l'indicateur..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.9375rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
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

              <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
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
                  📁 Importer un JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json"
                  style={{ display: 'none' }}
                  onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={exportToFile}
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
                  💾 Exporter le JSON
                </button>
              </div>
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
                Sujet
              </h2>
              <SubjectBlock
                value={indicator.sujet}
                onChange={(sujet) => setIndicator({ ...indicator, sujet })}
              />
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
              border: '1px solid #e2e8f0',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Colonnes
                </h2>
                <button
                  type="button"
                  onClick={addColumn}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
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
                  + Ajouter une colonne
                </button>
              </div>
              {indicator.colonnes.length === 0 ? (
                <p style={{
                  color: '#94a3b8',
                  fontSize: '0.875rem',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '2rem'
                }}>
                  Aucune colonne définie. Ajoutez-en une pour commencer.
                </p>
              ) : (
                indicator.colonnes.map((col: any, i: number) => (
                  <div key={i} style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <ColumnBlock
                      value={col}
                      onChange={(newCol) => updateColumn(i, newCol)}
                      onDelete={() => deleteColumn(i)}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Section Résultats d'exécution */}
            {(executionResult || executionError) && (
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
                  Résultats de l'exécution
                </h2>
                
                {executionError && (
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    fontSize: '0.875rem',
                    marginBottom: '1rem'
                  }}>
                    {executionError}
                  </div>
                )}

                {executionResult && (
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                        <strong>SQL généré :</strong>
                      </p>
                      <pre style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.8125rem',
                        overflow: 'auto',
                        maxHeight: '200px',
                        fontFamily: 'monospace',
                        color: '#1e293b'
                      }}>
                        {executionResult.sql}
                      </pre>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        <strong>{executionResult.row_count}</strong> ligne{executionResult.row_count > 1 ? 's' : ''} retournée{executionResult.row_count > 1 ? 's' : ''}
                      </p>
                    </div>

                    {executionResult.rows.length > 0 && (
                      <div style={{
                        overflowX: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}>
                        <table style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          fontSize: '0.875rem'
                        }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc' }}>
                              {executionResult.columns.map((col, idx) => (
                                <th key={idx} style={{
                                  padding: '0.75rem',
                                  textAlign: 'left',
                                  fontWeight: '600',
                                  color: '#1e293b',
                                  borderBottom: '2px solid #e2e8f0'
                                }}>
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {executionResult.rows.slice(0, 50).map((row, rowIdx) => (
                              <tr key={rowIdx} style={{
                                borderBottom: '1px solid #e2e8f0'
                              }}>
                                {executionResult.columns.map((col, colIdx) => (
                                  <td key={colIdx} style={{
                                    padding: '0.75rem',
                                    color: '#475569'
                                  }}>
                                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {executionResult.rows.length > 50 && (
                          <p style={{
                            padding: '0.75rem',
                            fontSize: '0.8125rem',
                            color: '#64748b',
                            textAlign: 'center',
                            fontStyle: 'italic'
                          }}>
                            ... et {executionResult.rows.length - 50} ligne{executionResult.rows.length - 50 > 1 ? 's' : ''} supplémentaire{executionResult.rows.length - 50 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end',
              flexWrap: 'wrap'
            }}>
              <button
                type="button"
                onClick={handleExecute}
                disabled={isExecuting || !indicator?.sujet?.tables?.length || !indicator?.colonnes?.length}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isExecuting || !indicator?.sujet?.tables?.length || !indicator?.colonnes?.length ? '#94a3b8' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: isExecuting || !indicator?.sujet?.tables?.length || !indicator?.colonnes?.length ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isExecuting || !indicator?.sujet?.tables?.length || !indicator?.colonnes?.length ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isExecuting && indicator?.sujet?.tables?.length && indicator?.colonnes?.length) {
                    e.currentTarget.style.backgroundColor = '#059669';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isExecuting && indicator?.sujet?.tables?.length && indicator?.colonnes?.length) {
                    e.currentTarget.style.backgroundColor = '#10b981';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {isExecuting ? '⏳ Exécution...' : '▶️ Tester l\'indicateur'}
              </button>
              <button
                type="button"
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
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSaving}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: isSaving ? '#94a3b8' : '#1e40af',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
                  fontWeight: '600',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSaving ? 'none' : '0 4px 12px rgba(30, 64, 175, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = '#1e3a8a';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSaving) {
                    e.currentTarget.style.backgroundColor = '#1e40af';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
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
