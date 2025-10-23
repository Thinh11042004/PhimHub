import { http } from './http';

export { http };

export function getApiBaseUrl(): string {
  return (http.defaults.baseURL || '').toString();
}

export async function apiRequest<T = any>(endpoint: string, init: any = {}): Promise<T> {
  const method = (init.method || 'GET').toLowerCase();
  const config = { ...init };
  const data = init.body ? JSON.parse(init.body) : undefined;
  if (method === 'get') return http.get(endpoint, config as any);
  if (method === 'post') return http.post(endpoint, data, config as any);
  if (method === 'put') return http.put(endpoint, data, config as any);
  if (method === 'patch') return http.patch(endpoint, data, config as any);
  if (method === 'delete') return http.delete(endpoint, config as any);
  return http.request({ url: endpoint, method, data, ...config });
}

export const call = apiRequest;