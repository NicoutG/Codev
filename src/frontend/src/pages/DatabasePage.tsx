import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Layout } from '../components/common/Layout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { metadataApi } from '../api/metadata';
import { importsApi, ImportResponse } from '../api/imports';
import { exportsApi } from '../api/exports';
import { dataApi, TableDataRow, TableDataResponse } from '../api/data';
import { commonStyles } from '../styles/common';
import { pageStyles } from '../styles/pages';

const DatabasePageContent: React.FC = () => {
  const { isEditeur } = useAuth();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'columns' | 'data'>('columns');
  
  // États pour les données
  const [tableData, setTableData] = useState<TableDataResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // États pour import/export
  const [isLoadingImportExport, setIsLoadingImportExport] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importProgress, setImportProgress] = useState<ImportResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableColumns(selectedTable);
      if (activeTab === 'data') {
        loadTableData();
      }
    }
  }, [selectedTable, activeTab]);

  useEffect(() => {
    if (selectedTable && activeTab === 'data') {
      loadTableData();
    }
  }, [selectedTable, activeTab, currentPage, searchTerm, sortColumn, sortOrder]);

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

  const loadTableData = async () => {
    if (!selectedTable) return;
    
    try {
      setIsLoadingData(true);
      setError('');
      const skip = (currentPage - 1) * rowsPerPage;
      const data = await dataApi.getTableData(selectedTable, {
        skip,
        limit: rowsPerPage,
        search: searchTerm || undefined,
        sort_by: sortColumn || undefined,
        sort_order: sortOrder
      });
      setTableData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors du chargement des données');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTable) return;

    try {
      setIsLoadingImportExport(true);
      setError('');
      setSuccess('');
      const result = await importsApi.importCsv(selectedTable, file);
      setImportProgress(result);
      setSuccess(`Import réussi : ${result.upserted_rows} lignes importées sur ${result.processed_rows} traitées`);
      if (activeTab === 'data') {
        loadTableData();
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'import du fichier CSV');
    } finally {
      setIsLoadingImportExport(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    if (!selectedTable) return;

    try {
      setIsLoadingImportExport(true);
      setError('');
      setSuccess('');
      await exportsApi.downloadCsv(selectedTable, ';', true);
      setSuccess('Export réussi ! Le fichier CSV a été téléchargé.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'export du fichier CSV');
    } finally {
      setIsLoadingImportExport(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
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

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    return String(value);
  };

  const totalPages = tableData ? Math.ceil(tableData.total / rowsPerPage) : 0;

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
        <div style={commonStyles.pageHeader}>
          <h1 style={commonStyles.pageTitle}>
            Base de données
          </h1>
          <p style={commonStyles.pageSubtitle}>
            Gérez les données des tables et importez/exportez des fichiers CSV
          </p>
        </div>

        {error && (
          <div style={commonStyles.errorMessage}>
            {error}
          </div>
        )}

        {success && (
          <div style={commonStyles.successMessage}>
            {success}
          </div>
        )}

        {importProgress && (
          <div style={commonStyles.infoMessage}>
            <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Résultat de l'import :</div>
            <div>• Lignes traitées : {importProgress.processed_rows}</div>
            <div>• Lignes importées/mises à jour : {importProgress.upserted_rows}</div>
            {importProgress.ignored_columns.length > 0 && (
              <div>• Colonnes ignorées : {importProgress.ignored_columns.join(', ')}</div>
            )}
          </div>
        )}

        <div style={commonStyles.pageContainer}>
          {/* Main content - Détails de la table */}
          {selectedTable && (
            <div>
              <div style={commonStyles.card}>
                <div style={pageStyles.database.headerContent}>
                  <div style={pageStyles.database.tableInfo}>
                    <div style={pageStyles.database.tableInfoHeader}>
                      <div style={pageStyles.database.tableIcon}>
                        📊
                      </div>
                      <div>
                        <h2 style={pageStyles.database.tableTitle}>
                          {getTableDisplayName(selectedTable)}
                        </h2>
                        <p style={pageStyles.database.tableDescription}>
                          {getTableDescription(selectedTable)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={pageStyles.database.headerActions}>
                    {/* Sélecteur de table en haut à droite */}
                    <div style={pageStyles.database.tableSelector}>
                      <select
                        value={selectedTable || ''}
                        onChange={(e) => {
                          const table = e.target.value;
                          if (table) {
                            setSelectedTable(table);
                            setImportProgress(null);
                            setSuccess('');
                            setError('');
                            setSearchTerm('');
                            setSortColumn(null);
                            setSortOrder('asc');
                            setCurrentPage(1);
                          }
                        }}
                        style={commonStyles.select}
                        onFocus={(e) => {
                          Object.assign(e.target.style, commonStyles.selectFocus);
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
                        }}
                        onMouseEnter={(e) => {
                          if (document.activeElement !== e.target) {
                            Object.assign(e.target.style, commonStyles.selectHover);
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (document.activeElement !== e.target) {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.backgroundColor = 'white';
                          }
                        }}
                      >
                        {tables.map((table) => (
                          <option key={table} value={table}>
                            {getTableDisplayName(table)}
                          </option>
                        ))}
                      </select>
                    </div>
                    {isEditeur && (
                      <>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoadingImportExport}
                          style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: isLoadingImportExport ? '#94a3b8' : '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            cursor: isLoadingImportExport ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isLoadingImportExport ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                          onMouseEnter={(e) => {
                            if (!isLoadingImportExport) {
                              e.currentTarget.style.backgroundColor = '#059669';
                              e.currentTarget.style.transform = 'translateY(-1px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isLoadingImportExport) {
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
                      disabled={isLoadingImportExport}
                      style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: isLoadingImportExport ? '#94a3b8' : '#1e40af',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: isLoadingImportExport ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isLoadingImportExport ? 'none' : '0 4px 12px rgba(30, 64, 175, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoadingImportExport) {
                          e.currentTarget.style.backgroundColor = '#1e3a8a';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(30, 64, 175, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoadingImportExport) {
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

                {/* Onglets */}
                <div style={commonStyles.tabContainer}>
                  <button
                    onClick={() => setActiveTab('columns')}
                    style={{
                      ...commonStyles.tab,
                      ...(activeTab === 'columns' ? commonStyles.tabActive : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== 'columns') {
                        e.currentTarget.style.color = '#475569';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== 'columns') {
                        e.currentTarget.style.color = '#64748b';
                      }
                    }}
                  >
                    Colonnes ({columns.length})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('data');
                      if (!tableData) {
                        loadTableData();
                      }
                    }}
                    style={{
                      ...commonStyles.tab,
                      ...(activeTab === 'data' ? commonStyles.tabActive : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (activeTab !== 'data') {
                        e.currentTarget.style.color = '#475569';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeTab !== 'data') {
                        e.currentTarget.style.color = '#64748b';
                      }
                    }}
                  >
                    Données {tableData && `(${tableData.total})`}
                  </button>
                </div>

                {/* Contenu des onglets */}
                {activeTab === 'columns' && columns.length > 0 && (
                  <div>
                    <div style={commonStyles.flexRowBetween}>
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
                    <div style={pageStyles.database.columnsGrid}>
                      {columns.map((col) => (
                        <div
                          key={col}
                          title={col}
                          style={pageStyles.database.columnBadge}
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

                {activeTab === 'data' && (
                  <div>
                    {/* Barre de recherche */}
                    <div style={pageStyles.database.searchBar}>
                      <div style={commonStyles.searchContainer}>
                        <input
                          type="text"
                          placeholder="Rechercher dans les données..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          style={commonStyles.searchInput}
                          onFocus={(e) => {
                            Object.assign(e.target.style, commonStyles.inputFocus);
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <span style={commonStyles.searchIcon}>
                          🔍
                        </span>
                      </div>
                      {tableData && (
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#64748b',
                          whiteSpace: 'nowrap'
                        }}>
                          {tableData.total.toLocaleString('fr-FR')} ligne{tableData.total > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    {/* Tableau de données */}
                    {isLoadingData ? (
                      <div style={commonStyles.loadingContainer}>
                        <div style={commonStyles.loadingSpinner} />
                        <p style={{ color: '#64748b' }}>Chargement des données...</p>
                      </div>
                    ) : tableData && tableData.rows.length > 0 ? (
                      <>
                        <div style={commonStyles.tableContainer}>
                          <table style={commonStyles.table}>
                            <thead>
                              <tr style={commonStyles.tableHeader}>
                                {tableData.columns.map((col) => (
                                  <th
                                    key={col}
                                    onClick={() => handleSort(col)}
                                    style={commonStyles.tableHeaderCell}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f1f5f9';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = '#f8fafc';
                                    }}
                                  >
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem'
                                    }}>
                                      <span style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        flex: 1
                                      }} title={col}>
                                        {col}
                                      </span>
                                      {sortColumn === col && (
                                        <span style={{
                                          fontSize: '0.75rem',
                                          color: '#1e40af'
                                        }}>
                                          {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                      )}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableData.rows.map((row, idx) => (
                                <tr
                                  key={idx}
                                  style={commonStyles.tableRow}
                                  onMouseEnter={(e) => {
                                    Object.assign(e.currentTarget.style, commonStyles.tableRowHover);
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                  }}
                                >
                                  {tableData.columns.map((col) => (
                                    <td
                                      key={col}
                                      style={commonStyles.tableCell}
                                      title={formatCellValue(row[col])}
                                    >
                                      {formatCellValue(row[col])}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div style={commonStyles.paginationContainer}>
                            <div style={commonStyles.paginationInfo}>
                              Page {currentPage} sur {totalPages} • 
                              Affichage de {(currentPage - 1) * rowsPerPage + 1} à {Math.min(currentPage * rowsPerPage, tableData.total)} sur {tableData.total.toLocaleString('fr-FR')}
                            </div>
                            <div style={commonStyles.paginationButtons}>
                              <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                style={{
                                  ...commonStyles.paginationButton,
                                  ...(currentPage === 1 ? commonStyles.paginationButtonDisabled : commonStyles.paginationButtonEnabled),
                                }}
                                onMouseEnter={(e) => {
                                  if (currentPage !== 1) {
                                    Object.assign(e.currentTarget.style, commonStyles.paginationButtonHover);
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (currentPage !== 1) {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                  }
                                }}
                              >
                                Précédent
                              </button>
                              <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                  ...commonStyles.paginationButton,
                                  ...(currentPage === totalPages ? commonStyles.paginationButtonDisabled : commonStyles.paginationButtonEnabled),
                                }}
                                onMouseEnter={(e) => {
                                  if (currentPage !== totalPages) {
                                    Object.assign(e.currentTarget.style, commonStyles.paginationButtonHover);
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (currentPage !== totalPages) {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                  }
                                }}
                              >
                                Suivant
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : tableData && tableData.rows.length === 0 ? (
                      <div style={commonStyles.emptyState}>
                        <p style={commonStyles.emptyStateText}>
                          {searchTerm ? 'Aucun résultat trouvé pour votre recherche' : 'Aucune donnée dans cette table'}
                        </p>
                      </div>
                    ) : null}
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
