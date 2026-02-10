/**
 * Styles spécifiques aux pages
 */

import { commonStyles } from './common';

export const pageStyles = {
  // DatabasePage
  database: {
    tableSelector: {
      position: 'relative' as const,
      minWidth: '220px' as const,
    },
    headerActions: {
      display: 'flex' as const,
      gap: '0.75rem' as const,
      flexShrink: 0 as const,
      alignItems: 'center' as const,
      flexWrap: 'wrap' as const,
    },
    headerContent: {
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: '2rem' as const,
      paddingBottom: '1.5rem' as const,
      borderBottom: '2px solid #e2e8f0' as const,
      flexWrap: 'wrap' as const,
      gap: '1rem' as const,
    },
    tableInfo: {
      flex: 1 as const,
      minWidth: '200px' as const,
    },
    tableInfoHeader: {
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '0.75rem' as const,
      marginBottom: '0.5rem' as const,
    },
    tableIcon: {
      width: '40px' as const,
      height: '40px' as const,
      borderRadius: '8px' as const,
      backgroundColor: '#eff6ff' as const,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      color: '#1e40af' as const,
      fontSize: '1.25rem' as const,
      fontWeight: '600' as const,
    },
    tableTitle: {
      fontSize: '1.5rem' as const,
      fontWeight: '700' as const,
      color: '#1e293b' as const,
      margin: 0 as const,
    },
    tableDescription: {
      fontSize: '0.875rem' as const,
      color: '#64748b' as const,
      margin: '0.25rem 0 0 0' as const,
    },
    columnsGrid: {
      display: 'grid' as const,
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' as const,
      gap: '0.625rem' as const,
      maxHeight: '400px' as const,
      overflowY: 'auto' as const,
      padding: '0.5rem' as const,
      backgroundColor: '#f8fafc' as const,
      borderRadius: '8px' as const,
      border: '1px solid #e2e8f0' as const,
    },
    columnBadge: {
      padding: '0.625rem 0.75rem' as const,
      backgroundColor: 'white' as const,
      borderRadius: '6px' as const,
      border: '1px solid #e2e8f0' as const,
      fontSize: '0.8125rem' as const,
      color: '#475569' as const,
      fontFamily: 'monospace' as const,
      overflow: 'hidden' as const,
      textOverflow: 'ellipsis' as const,
      whiteSpace: 'nowrap' as const,
      cursor: 'default' as const,
      transition: 'all 0.2s ease' as const,
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)' as const,
    },
    searchBar: {
      display: 'flex' as const,
      gap: '1rem' as const,
      marginBottom: '1.5rem' as const,
      alignItems: 'center' as const,
    },
    pagination: {
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginTop: '1.5rem' as const,
      paddingTop: '1.5rem' as const,
      borderTop: '1px solid #e2e8f0' as const,
    },
  },

  // IndicatorCreate/Edit
  indicator: {
    formSection: {
      ...commonStyles.card,
    },
    sectionTitle: {
      fontSize: '1.25rem' as const,
      fontWeight: '600' as const,
      color: '#1e293b' as const,
      marginBottom: '1rem' as const,
    },
    sectionHeader: {
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: '1rem' as const,
    },
    columnItem: {
      marginBottom: '1rem' as const,
      padding: '1rem' as const,
      backgroundColor: '#f8fafc' as const,
      borderRadius: '8px' as const,
      border: '1px solid #e2e8f0' as const,
    },
    emptyColumns: {
      color: '#94a3b8' as const,
      fontSize: '0.875rem' as const,
      fontStyle: 'italic' as const,
      textAlign: 'center' as const,
      padding: '2rem' as const,
    },
    actionButtons: {
      display: 'flex' as const,
      gap: '1rem' as const,
      justifyContent: 'flex-end' as const,
      flexWrap: 'wrap' as const,
    },
    executionResult: {
      ...commonStyles.card,
    },
    sqlPreview: {
      padding: '1rem' as const,
      backgroundColor: '#f8fafc' as const,
      borderRadius: '8px' as const,
      border: '1px solid #e2e8f0' as const,
      fontSize: '0.8125rem' as const,
      overflow: 'auto' as const,
      maxHeight: '200px' as const,
      fontFamily: 'monospace' as const,
      color: '#1e293b' as const,
    },
    addColumnButton: {
      padding: '0.5rem 1rem' as const,
      backgroundColor: '#10b981' as const,
      color: 'white' as const,
      border: 'none' as const,
      borderRadius: '6px' as const,
      fontSize: '0.875rem' as const,
      fontWeight: '500' as const,
      cursor: 'pointer' as const,
      transition: 'all 0.2s ease' as const,
      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' as const,
    },
    importExportButtons: {
      display: 'flex' as const,
      gap: '0.75rem' as const,
      flexWrap: 'wrap' as const,
    },
  },

  // ReportView
  report: {
    indicatorCard: {
      backgroundColor: 'white' as const,
      borderRadius: '12px' as const,
      boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' as const,
      border: '1px solid #e2e8f0' as const,
      padding: '2rem' as const,
    },
    indicatorHeader: {
      marginBottom: '1.5rem' as const,
      paddingBottom: '1rem' as const,
      borderBottom: '2px solid #e2e8f0' as const,
    },
    indicatorTitle: {
      fontSize: '1.5rem' as const,
      fontWeight: '600' as const,
      color: '#1e293b' as const,
      marginBottom: '0.5rem' as const,
    },
    exportButtons: {
      display: 'flex' as const,
      gap: '0.75rem' as const,
      flexWrap: 'wrap' as const,
    },
  },

  // LoginPage
  login: {
    container: {
      minHeight: '100vh' as const,
      display: 'flex' as const,
      backgroundColor: '#f8fafc' as const,
    },
    formSection: {
      flex: '0 0 45%' as const,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      padding: '2rem' as const,
      backgroundColor: 'white' as const,
    },
    formContainer: {
      width: '100%' as const,
      maxWidth: '420px' as const,
    },
    imageSection: {
      flex: '1' as const,
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)' as const,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      position: 'relative' as const,
    },
  },
};
