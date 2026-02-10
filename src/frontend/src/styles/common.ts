/**
 * Styles communs réutilisables dans toute l'application
 */

export const commonStyles = {
  // Layout
  pageContainer: {
    width: '100%' as const,
  },

  // Headers
  pageHeader: {
    marginBottom: '2rem' as const,
  },
  pageTitle: {
    fontSize: '2rem' as const,
    fontWeight: '700' as const,
    color: '#1e293b' as const,
    marginBottom: '0.5rem' as const,
    letterSpacing: '-0.02em' as const,
  },
  pageSubtitle: {
    fontSize: '0.9375rem' as const,
    color: '#64748b' as const,
  },

  // Cards
  card: {
    backgroundColor: 'white' as const,
    borderRadius: '12px' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' as const,
    border: '1px solid #e2e8f0' as const,
    padding: '2rem' as const,
    marginBottom: '1.5rem' as const,
  },
  cardCompact: {
    backgroundColor: 'white' as const,
    borderRadius: '12px' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' as const,
    border: '1px solid #e2e8f0' as const,
    padding: '1.5rem' as const,
    marginBottom: '1.5rem' as const,
  },

  // Buttons
  buttonPrimary: {
    padding: '0.75rem 1.5rem' as const,
    backgroundColor: '#1e40af' as const,
    color: 'white' as const,
    border: 'none' as const,
    borderRadius: '8px' as const,
    fontSize: '0.9375rem' as const,
    fontWeight: '600' as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease' as const,
    boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)' as const,
  },
  buttonPrimaryHover: {
    backgroundColor: '#1e3a8a' as const,
    transform: 'translateY(-1px)' as const,
  },
  buttonPrimaryDisabled: {
    backgroundColor: '#94a3b8' as const,
    cursor: 'not-allowed' as const,
    boxShadow: 'none' as const,
  },

  buttonSecondary: {
    padding: '0.75rem 1.5rem' as const,
    backgroundColor: '#f1f5f9' as const,
    color: '#64748b' as const,
    border: 'none' as const,
    borderRadius: '8px' as const,
    fontSize: '0.9375rem' as const,
    fontWeight: '500' as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease' as const,
  },
  buttonSecondaryHover: {
    backgroundColor: '#e2e8f0' as const,
    color: '#475569' as const,
  },

  buttonSuccess: {
    padding: '0.75rem 1.5rem' as const,
    backgroundColor: '#10b981' as const,
    color: 'white' as const,
    border: 'none' as const,
    borderRadius: '8px' as const,
    fontSize: '0.875rem' as const,
    fontWeight: '600' as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease' as const,
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' as const,
    display: 'inline-flex' as const,
    alignItems: 'center' as const,
    gap: '0.5rem' as const,
  },
  buttonSuccessHover: {
    backgroundColor: '#059669' as const,
    transform: 'translateY(-1px)' as const,
    boxShadow: '0 6px 16px rgba(16, 185, 129, 0.4)' as const,
  },

  buttonSmall: {
    padding: '0.625rem 1.25rem' as const,
    fontSize: '0.875rem' as const,
    fontWeight: '500' as const,
  },

  // Inputs
  input: {
    width: '100%' as const,
    padding: '0.875rem 1rem' as const,
    border: '1px solid #e2e8f0' as const,
    borderRadius: '8px' as const,
    fontSize: '0.9375rem' as const,
    transition: 'all 0.2s ease' as const,
  },
  inputFocus: {
    borderColor: '#1e40af' as const,
    boxShadow: '0 0 0 3px rgba(30, 64, 175, 0.1)' as const,
  },
  textarea: {
    width: '100%' as const,
    padding: '0.875rem 1rem' as const,
    border: '1px solid #e2e8f0' as const,
    borderRadius: '8px' as const,
    fontSize: '0.9375rem' as const,
    fontFamily: 'inherit' as const,
    resize: 'vertical' as const,
    transition: 'all 0.2s ease' as const,
  },
  select: {
    padding: '0.75rem 2.5rem 0.75rem 1rem' as const,
    border: '1px solid #e2e8f0' as const,
    borderRadius: '8px' as const,
    fontSize: '0.875rem' as const,
    fontWeight: '500' as const,
    color: '#1e293b' as const,
    backgroundColor: 'white' as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease' as const,
    width: '100%' as const,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 9L1 4h10z'/%3E%3C/svg%3E")` as const,
    backgroundRepeat: 'no-repeat' as const,
    backgroundPosition: 'right 0.75rem center' as const,
    backgroundSize: '12px' as const,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)' as const,
  },
  selectFocus: {
    borderColor: '#1e40af' as const,
    boxShadow: '0 0 0 3px rgba(30, 64, 175, 0.1), 0 1px 2px rgba(0,0,0,0.05)' as const,
  },
  selectHover: {
    borderColor: '#cbd5e1' as const,
    backgroundColor: '#f8fafc' as const,
  },

  // Labels
  label: {
    display: 'block' as const,
    fontSize: '0.875rem' as const,
    fontWeight: '500' as const,
    color: '#1e293b' as const,
    marginBottom: '0.5rem' as const,
  },
  labelRequired: {
    color: '#ef4444' as const,
  },

  // Messages
  errorMessage: {
    marginBottom: '1.5rem' as const,
    padding: '1rem' as const,
    backgroundColor: '#fef2f2' as const,
    color: '#991b1b' as const,
    borderRadius: '8px' as const,
    border: '1px solid #fecaca' as const,
    fontSize: '0.875rem' as const,
  },
  successMessage: {
    marginBottom: '1.5rem' as const,
    padding: '1rem' as const,
    backgroundColor: '#f0fdf4' as const,
    color: '#166534' as const,
    borderRadius: '8px' as const,
    border: '1px solid #bbf7d0' as const,
    fontSize: '0.875rem' as const,
  },
  infoMessage: {
    marginBottom: '1.5rem' as const,
    padding: '1rem' as const,
    backgroundColor: '#eff6ff' as const,
    color: '#1e40af' as const,
    borderRadius: '8px' as const,
    border: '1px solid #dbeafe' as const,
    fontSize: '0.875rem' as const,
  },

  // Tabs
  tabContainer: {
    display: 'flex' as const,
    gap: '0.5rem' as const,
    marginBottom: '2rem' as const,
    borderBottom: '2px solid #e2e8f0' as const,
  },
  tab: {
    padding: '0.75rem 1.5rem' as const,
    backgroundColor: 'transparent' as const,
    color: '#64748b' as const,
    border: 'none' as const,
    borderBottom: '3px solid transparent' as const,
    borderRadius: '0' as const,
    fontSize: '0.9375rem' as const,
    fontWeight: '500' as const,
    cursor: 'pointer' as const,
    transition: 'all 0.2s ease' as const,
    marginBottom: '-2px' as const,
  },
  tabActive: {
    color: '#1e40af' as const,
    borderBottom: '3px solid #1e40af' as const,
    fontWeight: '600' as const,
  },
  tabHover: {
    color: '#475569' as const,
  },

  // Loading
  loadingSpinner: {
    display: 'inline-block' as const,
    width: '40px' as const,
    height: '40px' as const,
    border: '4px solid #e2e8f0' as const,
    borderTopColor: '#1e40af' as const,
    borderRadius: '50%' as const,
    animation: 'spin 1s linear infinite' as const,
    marginBottom: '1rem' as const,
  },
  loadingContainer: {
    textAlign: 'center' as const,
    padding: '4rem' as const,
    backgroundColor: '#f8fafc' as const,
    borderRadius: '8px' as const,
    border: '1px solid #e2e8f0' as const,
  },

  // Tables
  tableContainer: {
    overflowX: 'auto' as const,
    overflowY: 'visible' as const,
    borderRadius: '8px' as const,
    border: '1px solid #e2e8f0' as const,
    backgroundColor: 'white' as const,
    maxWidth: '100%' as const,
    position: 'relative' as const,
  },
  table: {
    width: '100%' as const,
    borderCollapse: 'collapse' as const,
    minWidth: '800px' as const,
    tableLayout: 'auto' as const,
  },
  tableHeader: {
    backgroundColor: '#f8fafc' as const,
  },
  tableHeaderCell: {
    padding: '0.875rem 1rem' as const,
    textAlign: 'left' as const,
    fontSize: '0.75rem' as const,
    fontWeight: '600' as const,
    color: '#64748b' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em' as const,
    borderBottom: '2px solid #e2e8f0' as const,
    cursor: 'pointer' as const,
    userSelect: 'none' as const,
    transition: 'background-color 0.2s ease' as const,
    position: 'sticky' as const,
    top: 0 as const,
    backgroundColor: '#f8fafc' as const,
    zIndex: 10 as const,
  },
  tableCell: {
    padding: '0.875rem 1rem' as const,
    fontSize: '0.875rem' as const,
    color: '#475569' as const,
    borderBottom: '1px solid #e2e8f0' as const,
    maxWidth: '300px' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
    whiteSpace: 'nowrap' as const,
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0' as const,
    transition: 'background-color 0.2s ease' as const,
  },
  tableRowHover: {
    backgroundColor: '#f8fafc' as const,
  },

  // Search
  searchContainer: {
    flex: 1 as const,
    position: 'relative' as const,
  },
  searchInput: {
    width: '100%' as const,
    padding: '0.75rem 1rem 0.75rem 2.5rem' as const,
    border: '1px solid #e2e8f0' as const,
    borderRadius: '8px' as const,
    fontSize: '0.9375rem' as const,
    transition: 'all 0.2s ease' as const,
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '0.75rem' as const,
    top: '50%' as const,
    transform: 'translateY(-50%)' as const,
    color: '#94a3b8' as const,
    fontSize: '1rem' as const,
  },

  // Empty states
  emptyState: {
    textAlign: 'center' as const,
    padding: '4rem' as const,
    backgroundColor: '#f8fafc' as const,
    borderRadius: '8px' as const,
    border: '1px solid #e2e8f0' as const,
    color: '#64748b' as const,
    fontSize: '0.9375rem' as const,
  },
  emptyStateText: {
    fontSize: '1rem' as const,
    color: '#64748b' as const,
  },

  // Pagination
  paginationContainer: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginTop: '1.5rem' as const,
    paddingTop: '1.5rem' as const,
    borderTop: '1px solid #e2e8f0' as const,
  },
  paginationInfo: {
    fontSize: '0.875rem' as const,
    color: '#64748b' as const,
  },
  paginationButtons: {
    display: 'flex' as const,
    gap: '0.5rem' as const,
  },
  paginationButton: {
    padding: '0.5rem 1rem' as const,
    border: '1px solid #e2e8f0' as const,
    borderRadius: '6px' as const,
    fontSize: '0.875rem' as const,
    fontWeight: '500' as const,
    transition: 'all 0.2s ease' as const,
  },
  paginationButtonEnabled: {
    backgroundColor: 'white' as const,
    color: '#64748b' as const,
    cursor: 'pointer' as const,
  },
  paginationButtonDisabled: {
    backgroundColor: '#f1f5f9' as const,
    color: '#94a3b8' as const,
    cursor: 'not-allowed' as const,
  },
  paginationButtonHover: {
    backgroundColor: '#f8fafc' as const,
    borderColor: '#cbd5e1' as const,
  },

  // Flex utilities
  flexRow: {
    display: 'flex' as const,
    gap: '1rem' as const,
    alignItems: 'center' as const,
  },
  flexRowBetween: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  flexCol: {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '1rem' as const,
  },
};

/**
 * Fonctions utilitaires pour les styles dynamiques
 */
export const styleUtils = {
  /**
   * Combine plusieurs styles en un seul objet
   */
  combine: (...styles: any[]) => {
    return Object.assign({}, ...styles);
  },

  /**
   * Applique un style conditionnel
   */
  conditional: (condition: boolean, style: any) => {
    return condition ? style : {};
  },
};
