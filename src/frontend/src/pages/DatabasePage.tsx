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
import styles from '../styles/pages/DatabasePage.module.css';

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

  const handleDownloadNomenclature = async () => {
    const fileUrl = "/codev_nomenclature.xlsx";

    try {
      const res = await fetch(fileUrl, { cache: "no-store" });

      if (!res.ok) {
        throw new Error(`Téléchargement impossible (${res.status})`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        throw new Error(
          "Le serveur renvoie du HTML à la place du fichier .xlsx (fallback SPA ou mauvais chemin)."
        );
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "codev_nomenclature.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      alert(
        "Impossible de télécharger la nomenclature. Vérifie que le fichier existe dans /public et que l’URL est correcte."
      );
    }
  };


  const totalPages = tableData ? Math.ceil(tableData.total / rowsPerPage) : 0;

  if (isLoading) {
    return (
      <Layout>
        <div className={styles.loadingCard}>
          <div className={styles.loadingSpinner} />
          <p className={styles.loadingText}>Chargement des tables...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>

        <div className={styles.topRow}>
          <div style={commonStyles.pageHeader}>
            <h1 style={commonStyles.pageTitle}>
              Base de données
            </h1>
            <p style={commonStyles.pageSubtitle}>
              Gérez les données des tables et importez/exportez des fichiers CSV
            </p>
          </div>
          <div>

           <button onClick={handleDownloadNomenclature} className={styles.nomenclatureBtn}>
              📥 Nomenclature
            </button>
          </div>
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
                        className={styles.select}
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
                        <button onClick={() => fileInputRef.current?.click()} disabled={isLoadingImportExport} className={styles.importBtn}>
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
                    <button onClick={handleExport} disabled={isLoadingImportExport} className={styles.exportBtn}>
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
                        <div key={col} title={col} className={styles.columnBadge}>
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
                                  <th key={col} onClick={() => handleSort(col)} style={commonStyles.tableHeaderCell}>
                                    <div className={styles.tableHeaderCellInner}>
                                      <span title={col}>{col}</span>
                                      {sortColumn === col && (
                                        <span style={{fontSize: '0.75rem', color: '#1e40af'}}>
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
                                <tr key={idx} style={commonStyles.tableRow}>
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
    <ProtectedRoute requiredRole="consultant">
      <DatabasePageContent />
    </ProtectedRoute>
  );
}
