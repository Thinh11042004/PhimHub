// axios/fetch helper with dynamic base URL and token

const DEFAULTS = {
  // Primary backend port in this repo
  localApi: 'http://localhost:3001/api',
};

export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_URL || (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) return stripTrailingSlash(envUrl);

  // If running behind devtunnel or same host, prefer same origin API guess
  try {
    const { protocol, hostname } = window.location;
    // Common dev ports mapping: vite 5173 -> backend 3001
    const guess = `${protocol}//${hostname}:3001/api`;
    return guess;
  } catch {
    return DEFAULTS.localApi;
  }
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, '');
}

export async function apiRequest<T = any>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const base = getApiBaseUrl();
  const token = localStorage.getItem('phimhub:token');
  const res = await fetch(`${base}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
    credentials: 'include',
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let errorMessage = res.statusText;
    
    // Thử parse JSON error response
    if (text) {
      try {
        const errorJson = JSON.parse(text);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        // Nếu không phải JSON, dùng text trực tiếp
        errorMessage = text || res.statusText;
      }
    }
    
    const error: any = new Error(errorMessage);
    error.status = res.status;
    error.response = text;
    throw error;
  }
  // Some endpoints may return empty bodies on DELETE
  const text = await res.text();
  try {
    return (text ? JSON.parse(text) : ({} as any)) as T;
  } catch {
    return {} as any;
  }
}

// Alias for apiRequest to maintain compatibility
export const call = apiRequest;