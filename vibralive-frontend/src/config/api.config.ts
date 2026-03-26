/**
 * API Configuration
 * Define the base URL for API calls to the backend
 * 
 * NOTE: In development, the Next.js proxy (configured in next.config.js) 
 * will intercept /api/* requests to the backend.
 * So we use relative paths instead of absolute URLs to avoid CORS issues.
 */

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Get base URL from environment variables or use defaults
const getApiBaseUrl = (): string => {
  // Always use relative paths to leverage Next.js rewrites for /api/* paths
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Products (POS module)
  PRODUCTS: '/pos/products',
  PRODUCT: (id: string) => `/pos/products/${id}`,

  // Services
  SERVICES: '/services',
  SERVICE: (id: string) => `/services/${id}`,

  // Clients
  CLIENTS: '/clients',
  CLIENT: (id: string) => `/clients/${id}`,

  // Pets
  PETS: '/pets',
  PET: (id: string) => `/pets/${id}`,

  // Appointments
  APPOINTMENTS: '/appointments',
  APPOINTMENT: (id: string) => `/appointments/${id}`,

  // Auth
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',

  // Clinics
  CLINICS: '/clinics',
  CLINIC: (id: string) => `/clinics/${id}`,

  // Users
  USERS: '/users',
  USER: (id: string) => `/users/${id}`,
};

/**
 * Build full API URL
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
