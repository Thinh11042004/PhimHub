import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { directorService, Director, DirectorMovie } from '../../../services/directors';
import PosterCard from '@shared/components/PosterCard';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function DirectorDetail() {
  const { id } = useParams<{ id: string }>();
  const [director, setDirector] = useState<Director | null>(null);
  const [movies, setMovies] = useState<DirectorMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDirectorData = async () => {
      setLoading(true);
      setError(null);
      try {
        const directorId = parseInt(id);
        const directorData = await directorService.getDirectorById(directorId);
        setDirector(directorData);

        const moviesData = await directorService.getMoviesByDirector(directorId);
        setMovies(moviesData);
      } catch (err: any) {
        setError(err.message || 'Không thể tải thông tin đạo diễn.');
      } finally {
        setLoading(false);
      }
    };

    fetchDirectorData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Đang tải thông tin đạo diễn...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        Lỗi: {error}
      </div>
    );
  }

  if (!director) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Không tìm thấy đạo diễn.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 lg:w-1/4">
          <img
            src={director.photo_url || 'https://via.placeholder.com/300x450?text=No+Image'}
            alt={director.name}
            className="w-full rounded-lg shadow-lg object-cover aspect-[2/3]"
          />
        </div>
        <div className="md:w-2/3 lg:w-3/4 space-y-4">
          <h1 className="text-4xl font-bold text-primary-300">{director.name}</h1>
          {director.dob && (
            <p className="text-lg text-white/80">
              Ngày sinh: <span className="font-medium">{format(new Date(director.dob), 'dd MMMM yyyy', { locale: vi })}</span>
            </p>
          )}
          {director.nationality && (
            <p className="text-lg text-white/80">
              Quốc tịch: <span className="font-medium">{director.nationality}</span>
            </p>
          )}
          {/* Thêm phần tiểu sử nếu có */}
          {/* <p className="text-white/90 leading-relaxed">
            {director.biography || 'Chưa có thông tin tiểu sử.'}
          </p> */}
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-3xl font-bold text-primary-300 mb-6">Phim đã đạo diễn</h2>
        {movies.length === 0 ? (
          <p className="text-white/70">Chưa có phim nào được liệt kê cho đạo diễn này.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {movies.map((movie) => (
              <Link to={`/${movie.is_series ? 'series' : 'movies'}/${movie.slug}`} key={movie.id}>
                <PosterCard
                  movie={{
                    id: movie.id.toString(),
                    title: movie.title,
                    poster: movie.poster_url || '',
                    year: movie.release_year,
                    isSeries: movie.is_series,
                  }}
                  size="medium"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
