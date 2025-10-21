// Utility functions for authentication

export function getAuthToken(): string | null {
  return localStorage.getItem('phimhub:token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('phimhub:token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('phimhub:token');
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
