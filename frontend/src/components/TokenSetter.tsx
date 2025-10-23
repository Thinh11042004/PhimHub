import { useEffect } from 'react';

function parseJwt<T = any>(token: string): T | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const payload: any = parseJwt(token);
  if (!payload?.exp) return false; // if no exp, assume not expired to avoid forced logout in dev
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

export default function TokenSetter() {
  useEffect(() => {
    const existingToken = localStorage.getItem('phimhub:token');
    const existingUser = localStorage.getItem('phimhub:user');

    // Clear expired token to avoid 401/403 loops
    if (existingToken && isExpired(existingToken)) {
      localStorage.removeItem('phimhub:token');
      console.warn('🔑 Existing token expired. Cleared localStorage token.');
    }

    // Optionally seed a dev token via env
    const devToken = (import.meta as any).env?.VITE_DEV_JWT as string | undefined;
    const tokenAfterClear = localStorage.getItem('phimhub:token');

    if (!tokenAfterClear && devToken) {
      if (!isExpired(devToken)) {
        localStorage.setItem('phimhub:token', devToken);
        console.log('🔑 Dev token set from VITE_DEV_JWT');
      } else {
        console.warn('🔑 VITE_DEV_JWT is expired. Please generate a new dev token.');
      }
    }

    // Seed user data only if absent (dev convenience)
    const userAfterToken = localStorage.getItem('phimhub:user');
    if (!userAfterToken) {
      const defaultUser = {
        id: 1,
        username: 'AnhHai',
        email: 'A1@gmail.com',
        role: 'user',
        avatar: '',
        fullname: 'Anh Hai',
        phone: '0123456789'
      };
      localStorage.setItem('phimhub:user', JSON.stringify(defaultUser));
      console.log('👤 User data seeded');
    }
  }, []);

  return null; // Component không render gì
}
