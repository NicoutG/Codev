import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { metadataApi } from '../api/metadata';
import { importsApi, ImportResponse } from '../api/imports';
import { exportsApi } from '../api/exports';

interface TableData {
  [key: string]: any;
}

const DatabasePageContent: React.FC = () => {
  const { isEditeur } = useAuth();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importProgress, setImportProgress] = useState<ImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableColumns(selectedTable);
    }
  }, [selectedTable]);

  const loadTables = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await metadataApi.listTables();
      setTables(data);
      if (data.length > 0 && !selectedTable) {
        setSelectedTable(data[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des tables');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableColumns = async (table: string) => {
    try {
      setError('');
      const cols = await metadataApi.listColumns(table);
      setColumns(cols);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des colonnes');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTable) return;

    try {
      setIsLoadingData(true);
      setError('');
      setSuccess('');
      const result = await importsApi.importCsv(selectedTable, file);
      setImportProgress(result);
      setSuccess(`Import réussi : ${result.upserted_rows} lignes importées sur ${result.processed_rows} traitées`);
      // Recharger les données si on les affiche
      if (tableData.length > 0) {
        // Optionnel : recharger les données
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'import du fichier CSV');
    } finally {
      setIsLoadingData(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    if (!selectedTable) return;

    try {
      setIsLoadingData(true);
      setError('');
      setSuccess('');
      await exportsApi.downloadCsv(selectedTable, ';', true);
      setSuccess('Export réussi ! Le fichier CSV a été téléchargé.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'export du fichier CSV');
    } finally {
      setIsLoadingData(false);
    }
  };

  const getTableDisplayName = (table: string) => {
    const names: Record<string, string> = {
      'etudiants': 'Étudiants',
      'insertion': 'Insertion professionnelle',
      'mobilite': 'Mobilité'
    };
    return names[table] || table;
  };

  const getTableDescription = (table: string) => {
    const descriptions: Record<string, string> = {
      'etudiants': 'Données sur les étudiants inscrits',
      'insertion': 'Données sur l\'insertion professionnelle des diplômés',
      'mobilite': 'Données sur la mobilité internationale'
    };
    return descriptions[table] || '';
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
          <p style={{ color: '#64748b' }}>Chargement des tables...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '0.5rem',
            letterSpacing: '-0.02em'
          }}>
            Base de données
          </h1>
          <p style={{
            fontSize: '0.9375rem',
            color: '#64748b'
          }}>
            Gérez les données des tables et importez/exportez des fichiers CSV
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

        {success && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            color: '#166534',
            borderRadius: '8px',
            border: '1px solid #bbf7d0',
            fontSize: '0.875rem'
          }}>
            {success}
          </div>
        )}

        {importProgress && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            borderRadius: '8px',
            border: '1px solid #dbeafe',
            fontSize: '0.875rem'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Résultat de l'import :</div>
            <div>• Lignes traitées : {importProgress.processed_rows}</div>
            <div>• Lignes importées/mises à jour : {importProgress.upserted_rows}</div>
            {importProgress.ignored_columns.length > 0 && (
              <div>• Colonnes ignorées : {importProgress.ignored_columns.join(', ')}</div>
            )}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '250px 1fr',
          gap: '1.5rem'
        }}>
          {/* Sidebar - Liste des tables */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            padding: '1.25rem',
            height: 'fit-content',
            position: 'sticky',
            top: '90px'
          }}>
            <h2 style={{
              fontSize: '0.9375rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #e2e8f0',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.75rem'
            }}>
              Tables ({tables.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {tables.map((table) => (
                <button
                  key={table}
                  onClick={() => {
                    setSelectedTable(table);
                    setImportProgress(null);
                    setSuccess('');
                    setError('');
                  }}
                  style={{
                    padding: '0.875rem 1rem',
                    textAlign: 'left',
                    backgroundColor: selectedTable === table ? '#eff6ff' : 'transparent',
                    color: selectedTable === table ? '#1e40af' : '#64748b',
                    border: selectedTable === table ? '1px solid #93c5fd' : '1px solid transparent',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: selectedTable === table ? '600' : '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedTable === table ? '0 2px 4px rgba(30, 64, 175, 0.1)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTable !== table) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTable !== table) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  {getTableDisplayName(table)}
                </button>
              ))}
            </div>
          </div>

          {/* Main content - Détails de la table */}
          {selectedTable && (
            <div>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
                padding: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '2rem',
                  paddingBottom: '1.5rem',
                  borderBottom: '2px solid #e2e8f0'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      marginBottom: '0.5rem'
                    }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1e40af',
                        fontSize: '1.25rem',
                        fontWeight: '600'
                      }}>
                        📊
                      </div>
                      <div>
                        <h2 style={{
                          fontSize: '1.5rem',
                          fontWeight: '700',
                          color: '#1e293b',
                          margin: 0
                        }}>
                          {getTableDisplayName(selectedTable)}
                        </h2>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          margin: '0.25rem 0 0 0'
                        }}>
                          {getTableDescription(selectedTable)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                    {isEditeur && (
                      <>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoadingData}
                          style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: isLoadingData ? '#94a3b8' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: isLoadingData ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isLoadingData ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                          onMouseEnter={(e) => {
                            if (!isLoadingData) {
                              e.currentTarget.style.backgroundColor = '#059669';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isLoadingData) {
                              e.currentTarget.style.backgroundColor = '#10b981';
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }
                          }}
                        >
                          <span>📁</span>
                          <span>Importer CSV</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          style={{ display: 'none' }}
                          onChange={handleImport}
                        />
                      </>
                    )}
                    <button
                      onClick={handleExport}
                      disabled={isLoadingData}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: isLoadingData ? '#94a3b8' : '#1e40af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: isLoadingData ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isLoadingData ? 'none' : '0 4px 12px rgba(30, 64, 175, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoadingData) {
                          e.currentTarget.style.backgroundColor = '#1e3a8a';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 64, 175, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoadingData) {
                          e.currentTarget.style.backgroundColor = '#1e40af';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(30, 64, 175, 0.3)';
                        }
                      }}
                    >
                      <span>💾</span>
                      <span>Exporter CSV</span>
                    </button>
                  </div>
                </div>

                {columns.length > 0 && (
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        Colonnes ({columns.length})
                      </h3>
                      <div style={{
                        fontSize: '0.8125rem',
                        color: '#94a3b8'
                      }}>
                        {columns.length} colonne{columns.length > 1 ? 's' : ''} disponible{columns.length > 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '0.625rem',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      padding: '0.5rem',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {columns.map((col) => (
                        <div
                          key={col}
                          title={col}
                          style={{
                            padding: '0.625rem 0.75rem',
                            backgroundColor: 'white',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '0.8125rem',
                            color: '#475569',
                            fontFamily: 'monospace',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'default',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                            e.currentTarget.style.borderColor = '#93c5fd';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(30, 64, 175, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'white';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                          }}
                        >
                          {col}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default function DatabasePage() {
  return (
    <ProtectedRoute>
      <DatabasePageContent />
    </ProtectedRoute>
  );
}
