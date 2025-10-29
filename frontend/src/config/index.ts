// Application configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const APP_CONFIG = {
  API_BASE_URL,
  APP_NAME: 'PhimHub',
  VERSION: '1.0.0',
} as const;
