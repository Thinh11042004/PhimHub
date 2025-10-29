import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { actorService, Actor, ActorsResponse } from '../../../services/actors';
import ActorCard from '../../../shared/components/ActorCard';

export default function ActorsList() {
  const navigate = useNavigate();
  const [actors, setActors] = useState<Actor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Actor[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchActors();
  }, [currentPage]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        searchActors();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const fetchActors = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: ActorsResponse = await actorService.getAllActors(currentPage, 24);
      setActors(response.actors);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Error fetching actors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load actors');
    } finally {
      setLoading(false);
    }
  };

  const searchActors = async () => {
    try {
      setIsSearching(true);
      const results = await actorService.searchActors(searchQuery, 20);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching actors:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleActorClick = (actor: Actor) => {
    navigate(`/actor/${actor.id}`);
  };

  const displayActors = searchQuery.trim().length >= 2 ? searchResults : actors;
  const showPagination = searchQuery.trim().length < 2;

  if (loading && actors.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/70">Đang tải danh sách diễn viên...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Diễn viên</h1>
          <p className="text-white/70 text-lg">
            Khám phá các diễn viên tài năng và những bộ phim của họ
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Tìm kiếm diễn viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent backdrop-blur-sm"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              {isSearching ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">😞</div>
            <h3 className="text-xl font-semibold text-white mb-2">Có lỗi xảy ra</h3>
            <p className="text-white/70 mb-6">{error}</p>
            <button
              onClick={fetchActors}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Actors Grid */}
        {!error && (
          <>
            {displayActors.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mb-8">
                  {displayActors.map((actor) => (
                    <div
                      key={actor.id}
                      onClick={() => handleActorClick(actor)}
                      className="cursor-pointer"
                    >
                      <ActorCard
                        actor={actor}
                        size="large"
                        showRole={false}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {showPagination && totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg transition-colors ${
                              currentPage === page
                                ? 'bg-primary text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery.trim().length >= 2 ? 'Không tìm thấy diễn viên' : 'Chưa có diễn viên nào'}
                </h3>
                <p className="text-white/70">
                  {searchQuery.trim().length >= 2 
                    ? 'Thử tìm kiếm với từ khóa khác' 
                    : 'Hiện tại chưa có diễn viên nào trong hệ thống'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
