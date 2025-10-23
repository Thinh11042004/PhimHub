import { useState, useEffect } from 'react';
import { http } from '../lib/http';

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
        const data = await http.get(`/movies/search`, { params: { q: movieTitle, limit: 1 } });
        const items = (data as any)?.data || [];
        if (items.length > 0) {
          const movie = items[0];
          setPoster({ poster_url: movie.poster_url, banner_url: movie.banner_url, title: movie.title });
        } else {
          setPoster({
            poster_url: 'https://images.unsplash.com/photo-1489599804151-0b6a0b0b0b0b?q=80&w=1000&auto=format&fit=crop',
            banner_url: 'https://images.unsplash.com/photo-1489599804151-0b6a0b0b0b0b?q=80&w=1000&auto=format&fit=crop',
            title: 'PhimHub'
          });
        }
      } catch (err: any) {
        console.error('Error fetching movie poster:', err);
        setError(err?.message || 'Unknown error');
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
