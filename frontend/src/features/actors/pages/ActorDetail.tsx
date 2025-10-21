import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { actorService, ActorWithMovies } from '../../../services/actors';
import { Movie } from '../../../services/movies/model';
import PosterCard from '../../../shared/components/PosterCard';
import { useAuth } from '../../../store/auth';

export default function ActorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [actor, setActor] = useState<ActorWithMovies | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'movies' | 'recent' | 'popular'>('movies');

  useEffect(() => {
    if (!id) {
      setError('Actor ID not found');
      setLoading(false);
      return;
    }

    const fetchActor = async () => {
      try {
        setLoading(true);
        setError(null);
        const actorData = await actorService.getActorById(parseInt(id));
        setActor(actorData);
      } catch (err) {
        console.error('Error fetching actor:', err);
        setError(err instanceof Error ? err.message : 'Failed to load actor');
      } finally {
        setLoading(false);
      }
    };

    fetchActor();
  }, [id]);

  const handleMovieClick = (movie: any) => {
    navigate(`/movie/${movie.slug}`);
  };

  const getDisplayMovies = () => {
    if (!actor) return [];
    
    switch (activeTab) {
      case 'recent':
        return actorService.getRecentMovies(actor, 12);
      case 'popular':
        return actorService.getPopularMovies(actor, 12);
      default:
        return actor.movies;
    }
  };

  const getAge = () => {
    if (!actor?.dob) return null;
    return actorService.getActorAge(actor.dob);
  };

  const formatDateOfBirth = () => {
    if (!actor?.dob) return null;
    return actorService.formatDateOfBirth(actor.dob);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/70">Đang tải thông tin diễn viên...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !actor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-6xl mb-4">😞</div>
              <h1 className="text-2xl font-bold text-white mb-2">Không tìm thấy diễn viên</h1>
              <p className="text-white/70 mb-6">{error || 'Diễn viên không tồn tại'}</p>
              <button
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
              >
                Quay lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const displayMovies = getDisplayMovies();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header Section */}
      <div className="relative">
        {/* Background Image */}
        {actor.photo_url && (
          <div className="absolute inset-0 h-96 bg-cover bg-center bg-no-repeat opacity-20"
               style={{ backgroundImage: `url(${actor.photo_url})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>
          </div>
        )}
        
        {/* Content */}
        <div className="relative container mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Actor Photo */}
            <div className="flex-shrink-0">
              <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-2xl overflow-hidden ring-4 ring-white/20 shadow-2xl">
                {actor.photo_url ? (
                  <img
                    src={actor.photo_url}
                    alt={actor.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/placeholder-actor.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-6xl text-white/50">🎭</div>
                  </div>
                )}
              </div>
            </div>

            {/* Actor Info */}
            <div className="flex-1 text-white">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">{actor.name}</h1>
              
              <div className="space-y-3 mb-6">
                {actor.nationality && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">Quốc tịch:</span>
                    <span className="font-medium">{actor.nationality}</span>
                  </div>
                )}
                
                {formatDateOfBirth() && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/70">Ngày sinh:</span>
                    <span className="font-medium">{formatDateOfBirth()}</span>
                    {getAge() && (
                      <span className="text-white/50">({getAge()} tuổi)</span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="text-white/70">Số phim:</span>
                  <span className="font-medium">{actor.movies.length} phim</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(-1)}
                  className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                >
                  Quay lại
                </button>
                {user && (
                  <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
                    Theo dõi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movies Section */}
      <div className="container mx-auto px-4 pb-12">
        {/* Tab Navigation */}
        <div className="flex gap-1 mb-8 bg-white/5 rounded-xl p-1 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-6 py-2 rounded-lg transition-colors ${
              activeTab === 'movies'
                ? 'bg-primary text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Tất cả phim ({actor.movies.length})
          </button>
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-6 py-2 rounded-lg transition-colors ${
              activeTab === 'recent'
                ? 'bg-primary text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Phim gần đây
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`px-6 py-2 rounded-lg transition-colors ${
              activeTab === 'popular'
                ? 'bg-primary text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            Phim nổi bật
          </button>
        </div>

        {/* Movies Grid */}
        {displayMovies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => handleMovieClick(movie)}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 ring-1 ring-white/10 group-hover:ring-white/30 transition-all duration-300 group-hover:scale-105">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder-movie.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <div className="text-4xl text-white/50">🎬</div>
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-5-8V6a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <h3 className="font-medium text-white text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {movie.title}
                  </h3>
                  {movie.release_year && (
                    <p className="text-white/60 text-xs mt-1">{movie.release_year}</p>
                  )}
                  {movie.role_name && (
                    <p className="text-white/50 text-xs mt-1">Vai: {movie.role_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎭</div>
            <h3 className="text-xl font-semibold text-white mb-2">Chưa có phim nào</h3>
            <p className="text-white/70">Diễn viên này chưa có phim nào trong hệ thống.</p>
          </div>
        )}
      </div>
    </div>
  );
}
