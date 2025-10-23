import { useEffect, useMemo, useRef, useState, useCallback } from 'react';

export interface Person { 
  id: number; 
  name: string; 
  avatar: string | null; 
  nationality?: string | null; 
  dob?: string | null;
  photo_url?: string | null;
}

type Role = 'actor' | 'director';
type Options = { 
  open: boolean; 
  role: Role; 
  query: string; 
  pageSize?: number; 
};

export function usePeopleSearchInfinite({ open, role, query, pageSize = 50 }: Options) {
  const [items, setItems] = useState<Person[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  // Reset when query changes
  useEffect(() => {
    if (open) {
      setItems([]);
      setTotal(0);
      setCurrentPage(0);
      setHasMore(true);
      setError(null);
    }
  }, [open, query, role]);

  const fetchPage = useCallback(async (page: number, searchQuery: string = '') => {
    try {
      const offset = page * pageSize;
      const url = new URL('/api/people/selection', API_BASE);
      url.searchParams.set('role', role);
      if (searchQuery.trim()) url.searchParams.set('q', searchQuery.trim());
      url.searchParams.set('limit', String(pageSize));
      url.searchParams.set('offset', String(offset));

      const headers: HeadersInit = { Accept: 'application/json' };
      const token = localStorage.getItem('phimhub:token'); 
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(url.toString(), { 
        method: 'GET', 
        credentials: 'include', 
        headers 
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      
      // Handle both new format {items, total} and old format {success, data}
      const newItems = Array.isArray(data?.items) ? data.items
        : Array.isArray(data?.data) ? data.data.map((a: any) => ({ 
            id: a.id, 
            name: a.name, 
            avatar: a.photo_url ?? null,
            nationality: a.nationality ?? null,
            dob: a.dob ?? null,
            photo_url: a.photo_url ?? null
          })) : [];

      const newTotal = Number.isFinite(data?.total) ? data.total : newItems.length;
      
      if (page === 0) {
        // First page - replace items
        setItems(newItems);
        setTotal(newTotal);
      } else {
        // Subsequent pages - append items (avoid duplicates)
        setItems(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const uniqueNewItems = newItems.filter(item => !existingIds.has(item.id));
          return [...prev, ...uniqueNewItems];
        });
      }
      
      setHasMore(newItems.length === pageSize && (page + 1) * pageSize < newTotal);
      setCurrentPage(page);
      
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load data');
    }
  }, [API_BASE, role, pageSize]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      abortRef.current?.abort();
      const ctrl = new AbortController(); 
      abortRef.current = ctrl;

      fetchPage(0, query).finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    }, 300);
    
    return () => { 
      if (debounceRef.current) window.clearTimeout(debounceRef.current); 
      abortRef.current?.abort(); 
    };
  }, [open, query, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      await fetchPage(currentPage + 1, query);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, currentPage, query, fetchPage]);

  return { 
    items, 
    total, 
    loading, 
    loadingMore,
    error, 
    hasMore, 
    loadMore,
    currentPage: currentPage + 1,
    totalPages: Math.ceil(total / pageSize)
  };
}
