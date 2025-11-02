import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { directorService, Director, DirectorMovie } from '../../../services/directors';
import PosterCard from '@shared/components/PosterCard';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getImageUrl } from '../../../utils/imageProxy';

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex min-h-screen items-center justify-center text-white">
          Đang tải thông tin đạo diễn...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex min-h-screen items-center justify-center text-red-500">
          Lỗi: {error}
        </div>
      </div>
    );
  }

  if (!director) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="flex min-h-screen items-center justify-center text-white">
          Không tìm thấy đạo diễn.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with blurred background similar to ActorDetail */}
      <div className="relative">
        {director.photo_url && (
          <div
            className="absolute inset-0 h-96 bg-cover bg-center bg-no-repeat opacity-20"
            style={{ backgroundImage: `url(${getImageUrl(director.photo_url)})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
          </div>
        )}

        <div className="relative container mx-auto px-4 py-12 text-white">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-shrink-0">
              <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl">
                {director.photo_url ? (
                  <img
                    src={getImageUrl(director.photo_url)}
                    alt={director.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-6xl text-white/50">🎬</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 text-primary-300">{director.name}</h1>
              <div className="space-y-3 mb-2">
                {director.nationality && (
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-white/70">Quốc tịch:</span>
                    <span className="font-medium">{director.nationality}</span>
                  </div>
                )}
                {director.dob && (
                  <div className="flex items-center gap-2 text-white">
                    <span className="text-white/70">Ngày sinh:</span>
                    <span className="font-medium">{format(new Date(director.dob), 'dd MMMM yyyy', { locale: vi })}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-white">
                  <span className="text-white/70">Số phim:</span>
                  <span className="font-medium">{movies.length} phim</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movies section */}
      <div className="container mx-auto px-4 pb-12 text-white">
        <div className="mt-4">
          <h2 className="text-3xl font-bold text-primary-300 mb-6">Phim đã đạo diễn</h2>
          {movies.length === 0 ? (
            <p className="text-white/70">Chưa có phim nào được liệt kê cho đạo diễn này.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {movies.map((m) => (
                <Link to={`/${m.is_series ? 'series' : 'movies'}/${m.slug}`} key={m.id}>
                  {m.is_series ? (
                    <PosterCard
                      series={{
                        id: m.id.toString(),
                        title: m.title,
                        poster: m.poster_url || '',
                        year: m.release_year,
                        status: undefined,
                      }}
                      size="medium"
                    />
                  ) : (
                    <PosterCard
                      movie={{
                        id: m.id.toString(),
                        title: m.title,
                        poster: m.poster_url || '',
                        year: m.release_year,
                      }}
                      size="medium"
                    />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
