import { useState, useEffect } from 'react';

interface MoviePoster {
  poster_url?: string;
  banner_url?: string;
  title: string;
}

export function useMoviePoster(movieTitle: string) {
  const [poster, setPoster] = useState<MoviePoster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMoviePoster = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
        const response = await fetch(`${API_BASE}/movies/search?q=${encodeURIComponent(movieTitle)}&limit=1`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch movie');
        }
        
        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          const movie = data.data[0];
          setPoster({
            poster_url: movie.poster_url,
            banner_url: movie.banner_url,
            title: movie.title
          });
        } else {
          // Fallback to default poster if movie not found
          setPoster({
            poster_url: 'https://images.unsplash.com/photo-1489599804151-0b6a0b0b0b0b?q=80&w=1000&auto=format&fit=crop',
            banner_url: 'https://images.unsplash.com/photo-1489599804151-0b6a0b0b0b0b?q=80&w=1000&auto=format&fit=crop',
            title: 'PhimHub'
          });
        }
      } catch (err) {
        console.error('Error fetching movie poster:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback to default poster
        setPoster({
          poster_url: 'https://images.unsplash.com/photo-1489599804151-0b6a0b0b0b0b?q=80&w=1000&auto=format&fit=crop',
          banner_url: 'https://images.unsplash.com/photo-1489599804151-0b6a0b0b0b0b?q=80&w=1000&auto=format&fit=crop',
          title: 'PhimHub'
        });
      } finally {
        setLoading(false);
      }
    };

    if (movieTitle) {
      fetchMoviePoster();
    }
  }, [movieTitle]);

  return { poster, loading, error };
}
