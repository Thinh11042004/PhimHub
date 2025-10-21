import { useEffect, useMemo, useRef, useState } from 'react';

export interface Person { 
  id: number; 
  name: string; 
  avatar: string | null; 
  nationality?: string | null; 
}

type Role = 'actor' | 'director';
type Options = { 
  open: boolean; 
  role: Role; 
  query: string; 
  limit?: number; 
};

export function usePeopleSearch({ open, role, query, limit = 20 }: Options) {
  const [data, setData] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  const url = useMemo(() => {
    try {
      const u = new URL('/api/people/selection', API_BASE);
      u.searchParams.set('role', role);
      if (query.trim()) u.searchParams.set('q', query.trim());
      u.searchParams.set('limit', String(limit));
      u.searchParams.set('offset', '0');
      return u.toString();
    } catch (error) {
      console.error('Invalid API_BASE URL:', API_BASE, error);
      return 'http://localhost:3001/api/people/selection';
    }
  }, [API_BASE, role, query, limit]);

  useEffect(() => {
    if (!open) return;
    
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setLoading(true); 
      setError(null);
      abortRef.current?.abort();
      const ctrl = new AbortController(); 
      abortRef.current = ctrl;

      const headers: HeadersInit = { Accept: 'application/json' };
      const tk = localStorage.getItem('token'); 
      if (tk) headers.Authorization = `Bearer ${tk}`;

      fetch(url, { 
        method: 'GET', 
        signal: ctrl.signal, 
        credentials: 'include', 
        headers 
      })
        .then(async (r) => { 
          if (!r.ok) throw new Error(`HTTP ${r.status}`); 
          return r.json(); 
        })
        .then((j) => {
          console.log('API Response:', j);
          // Chuẩn hoá 2 shape: mới {items,total} hoặc cũ {success,data}
          const items = Array.isArray(j?.items) ? j.items
            : Array.isArray(j?.data) ? j.data.map((a: any) => ({ 
                id: a.id, 
                name: a.name, 
                avatar: a.photo_url ?? null,
                nationality: a.nationality ?? null
              })) : [];
          console.log('Mapped items:', items);
          setData(items); 
          setTotal(Number.isFinite(j?.total) ? j.total : items.length);
        })
        .catch(async (e) => {
          if (e.name === 'AbortError') return;
          try {
            const healthUrl = new URL('/api/people/health', API_BASE).toString();
            const res = await fetch(healthUrl, { 
              headers: { Accept: 'application/json' } 
            });
            const j = await res.json(); 
            setData(j.items ?? []); 
            setTotal(j.total ?? 0);
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            setError(String(e.message || e)); 
          }
        })
        .finally(() => { 
          if (!ctrl.signal.aborted) setLoading(false); 
        });
    }, 300);
    
    return () => { 
      if (debounceRef.current) window.clearTimeout(debounceRef.current); 
      abortRef.current?.abort(); 
    };
  }, [open, url]);

  return { data, total, loading, error };
}
