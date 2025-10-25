import { useEffect, useState } from 'react';
import { directorService, Director } from '../../../services/directors';
import DirectorCard from '@shared/components/DirectorCard';

export default function DirectorsList() {
  const [directors, setDirectors] = useState<Director[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const directorsPerPage = 20; // Number of directors to display per page

  useEffect(() => {
    const fetchDirectors = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await directorService.getAllDirectors(currentPage, directorsPerPage);
        setDirectors(response.directors);
        setTotalPages(Math.ceil(response.total / directorsPerPage));
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách đạo diễn.');
      } finally {
        setLoading(false);
      }
    };

    fetchDirectors();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Đang tải danh sách đạo diễn...
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

  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <h1 className="text-4xl font-bold text-primary-300 mb-8">Danh sách Đạo diễn</h1>
      {directors.length === 0 ? (
        <p className="text-white/70">Không có đạo diễn nào trong danh sách.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {directors.map((director) => (
              <DirectorCard key={director.id} director={director} size="medium" />
            ))}
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 py-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                <div className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white/70">
                  {currentPage}
                </div>
                <span className="text-white/50">/</span>
                <span className="text-white/70">{totalPages}</span>
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
