// Application configuration
const DEV_DEFAULT = 'http://localhost:3001/api';

export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL
  // Prefer explicit env
  || ((import.meta as any).env?.DEV ? DEV_DEFAULT
  // In production, default to same-origin /api (behind reverse proxy)
  : (typeof window !== 'undefined' ? `${window.location.origin}/api` : DEV_DEFAULT));

export const APP_CONFIG = {
  API_BASE_URL,
  APP_NAME: 'PhimHub',
  VERSION: '1.0.0',
} as const;
