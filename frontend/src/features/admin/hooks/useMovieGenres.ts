import { useEffect, useState } from 'react';

export type Genre = { id: number; name: string };

export function useMovieGenres(movieId: number | null) {
  const [all, setAll] = useState<Genre[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!movieId) {
      // Fallback to old API when no movieId
      console.log('🎬 No movieId, using fallback API');
      setLoading(true);
      setError(null);
      
      fetch(`${API_BASE}/api/genres`, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(j => {
          console.log('🎬 Fallback API response:', j);
          const allGenres = (j.data ?? []).map((g: any) => ({ 
            id: Number(g.id), 
            name: String(g.name) 
          }));
          console.log('🎬 Fallback API - allGenres:', allGenres);
          setAll(allGenres);
          setSelectedIds([]);
        })
        .catch(err => {
          console.error('🎬 Fallback API failed:', err);
          setError(err.message || 'Failed to fetch genres');
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    let aborted = false;
    setLoading(true);
    setError(null);
    
    console.log('🎬 useMovieGenres: Starting fetch for movieId:', movieId);

    // Try new API first, fallback to old API
    fetch(`${API_BASE}/api/admin/movies/${movieId}/genres`, { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(j => {
        if (aborted) return;
        
        console.log('🎬 New API response:', j);
        const allGenres = (j.all ?? []).map((g: any) => ({ 
          id: Number(g.id), 
          name: String(g.name) 
        }));
        const selected = Array.isArray(j.selectedIds) 
          ? j.selectedIds.map((x: any) => Number(x)).filter(Number.isFinite)
          : [];
          
        console.log('🎬 New API - allGenres:', allGenres);
        setAll(allGenres);
        setSelectedIds(selected);
      })
      .catch(err => {
        if (!aborted) {
          console.warn('🎬 New API failed, trying fallback:', err.message);
          // Fallback to old API
          return fetch(`${API_BASE}/api/genres`, { 
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
      })
      .then(r => {
        if (!r || aborted) return;
        if (!r.ok) throw new Error(`Fallback HTTP ${r.status}`);
        return r.json();
      })
      .then(j => {
        if (aborted) return;
        
        // Handle old API format
        const allGenres = (j.data ?? []).map((g: any) => ({ 
          id: Number(g.id), 
          name: String(g.name) 
        }));
        
        setAll(allGenres);
        setSelectedIds([]); // No selected genres from old API
      })
      .catch(err => {
        if (!aborted) {
          console.error('🎬 Both APIs failed:', err);
          setError(err.message || 'Failed to fetch genres');
        }
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });

    return () => { aborted = true; };
  }, [movieId, API_BASE]);

  const toggleGenre = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  const saveGenres = async (): Promise<{ success: boolean; message?: string }> => {
    if (!movieId) return { success: false, message: 'No movie ID' };

    try {
      const response = await fetch(`${API_BASE}/api/admin/movies/${movieId}/genres`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ genreIds: selectedIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: result.message || 'Genres saved successfully' };
    } catch (error: any) {
      console.error('Error saving genres:', error);
      return { success: false, message: error.message || 'Failed to save genres' };
    }
  };

  return { 
    all, 
    selectedIds, 
    setSelectedIds, 
    toggleGenre,
    saveGenres,
    loading, 
    error 
  };
}

// Hook cho series
export function useSeriesGenres(seriesId: number | null) {
  const [all, setAll] = useState<Genre[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  useEffect(() => {
    if (!seriesId) {
      // Fallback to old API when no seriesId
      console.log('🎬 No seriesId, using fallback API');
      setLoading(true);
      setError(null);
      
      fetch(`${API_BASE}/api/genres`, { 
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(r => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then(j => {
          console.log('🎬 Fallback API response:', j);
          const allGenres = (j.data ?? []).map((g: any) => ({ 
            id: Number(g.id), 
            name: String(g.name) 
          }));
          console.log('🎬 Fallback API - allGenres:', allGenres);
          setAll(allGenres);
          setSelectedIds([]);
        })
        .catch(err => {
          console.error('🎬 Fallback API failed:', err);
          setError(err.message || 'Failed to fetch genres');
        })
        .finally(() => {
          setLoading(false);
        });
      return;
    }

    let aborted = false;
    setLoading(true);
    setError(null);

    // Try new API first, fallback to old API
    fetch(`${API_BASE}/api/admin/series/${seriesId}/genres`, { 
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(j => {
        if (aborted) return;
        
        const allGenres = (j.all ?? []).map((g: any) => ({ 
          id: Number(g.id), 
          name: String(g.name) 
        }));
        const selected = Array.isArray(j.selectedIds) 
          ? j.selectedIds.map((x: any) => Number(x)).filter(Number.isFinite)
          : [];
          
        setAll(allGenres);
        setSelectedIds(selected);
      })
      .catch(err => {
        if (!aborted) {
          console.warn('New series API failed, trying fallback:', err.message);
          // Fallback to old API
          return fetch(`${API_BASE}/api/genres`, { 
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
        }
      })
      .then(r => {
        if (!r || aborted) return;
        if (!r.ok) throw new Error(`Fallback HTTP ${r.status}`);
        return r.json();
      })
      .then(j => {
        if (aborted) return;
        
        // Handle old API format
        const allGenres = (j.data ?? []).map((g: any) => ({ 
          id: Number(g.id), 
          name: String(g.name) 
        }));
        
        setAll(allGenres);
        setSelectedIds([]); // No selected genres from old API
      })
      .catch(err => {
        if (!aborted) {
          console.error('Both series APIs failed:', err);
          setError(err.message || 'Failed to fetch genres');
        }
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });

    return () => { aborted = true; };
  }, [seriesId, API_BASE]);

  const toggleGenre = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : [...prev, id]
    );
  };

  const saveGenres = async (): Promise<{ success: boolean; message?: string }> => {
    if (!seriesId) return { success: false, message: 'No series ID' };

    try {
      const response = await fetch(`${API_BASE}/api/admin/series/${seriesId}/genres`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ genreIds: selectedIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: result.message || 'Genres saved successfully' };
    } catch (error: any) {
      console.error('Error saving genres:', error);
      return { success: false, message: error.message || 'Failed to save genres' };
    }
  };

  return { 
    all, 
    selectedIds, 
    setSelectedIds, 
    toggleGenre,
    saveGenres,
    loading, 
    error 
  };
}
