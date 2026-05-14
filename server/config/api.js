// API Configuration
const getBaseUrl = () => {
  // Check if running in production
  if (import.meta.env.PROD) {
    // In production, use relative URLs (same domain)
    return '';
  }
  // In development, use the proxy
  return '';
};

export const API_BASE_URL = getBaseUrl();

// API Endpoints
export const ENDPOINTS = {
  // Public Endpoints
  PUBLIC_OVERVIEW_SUMMARY: '/api/public/overview/summary',
  PUBLIC_OVERVIEW_UTILIZATION: '/api/public/overview/utilization',
  PUBLIC_OVERVIEW_TREND: '/api/public/overview/spending-trend',
  PUBLIC_TRANSACTIONS: '/api/public/transactions',
  PUBLIC_TRANSACTIONS_EXPORT: '/api/public/transactions/export',
  PUBLIC_DOCUMENTS: '/api/public/documents',
  PUBLIC_DOCUMENTS_DOWNLOAD: '/api/public/documents/download',
  
  // Auth Endpoints
  LOGIN: '/api/users/login',
  REGISTER: '/api/users/register',
  
  // Admin Endpoints
  BUDGET: '/api/budget',
  EXPENSES: '/api/expenses',
  CATEGORIES: '/api/categories',
  TRANSACTIONS: '/api/transactions',
  DOCUMENTS: '/api/documents',
  OVERVIEW: '/api/overview',
  VALIDATION: '/api/validation',
  USERS: '/api/users',
};