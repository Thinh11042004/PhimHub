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
  if (token) {
    // Validate token format (basic JWT check)
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('❌ Invalid token format: token should have 3 parts separated by dots');
      console.error('Token preview:', token.substring(0, 20) + '...');
      // Clear invalid token
      removeAuthToken();
      localStorage.removeItem('phimhub:user');
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}
