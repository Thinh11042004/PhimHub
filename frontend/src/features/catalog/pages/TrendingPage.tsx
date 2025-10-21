import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MovieService } from "../../../services/movies";
import { getGenreDisplayName } from "../../../utils/genreMapper";
import PosterCard from "../../../shared/components/PosterCard";

/* --------- Data model (mapped từ provider/backend) --------- */
type Movie = {
  id: string; // slug
  title: string;
  year: number;
  age?: string;
  genres: string[];
  poster: string;
  provider?: string;
  rating?: number;
  duration?: number;
  overview?: string;
};

const GENRES = [
  "Hành động","Khoa học","Viễn tưởng","Kinh dị","Tâm lý","Hài hước","Hình sự","Chiến tranh",
  "Phiêu lưu","Cổ trang","Anime","Hoạt hình","Chính kịch","Lãng mạn","Âm nhạc","Thể thao",
  "Gia đình","Tài liệu","Kỳ ảo","Giật gân"
];

/* ------------------ UI Components ------------------ */
function Chip({
  children,
  active,
  onClick,
}: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        active 
          ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg" 
          : "bg-white/10 text-white hover:bg-white/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

// Wrapper component to adapt Movie type to PosterCard props
function TrendingPosterCard({ m }: { m: Movie }) {
  return (
    <PosterCard
      movie={{
        id: m.id,
        title: m.title,
        year: m.year,
        poster: m.poster,
        age: m.age,
        duration: m.duration,
        genres: m.genres,
        provider: m.provider,
        rating: m.rating,
        overview: m.overview
      }}
      size="large"
      showRating={true}
      showAge={true}
      showDuration={true}
      showGenres={true}
      showOverlay={true}
      showActions={true}
    />
  );
}

/* ------------------ Main Component ------------------ */
export default function TrendingPage() {
  const navigate = useNavigate();
  const [itemsAll, setItemsAll] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'rating' | 'views' | 'trending'>('trending');
  const [ageFilter, setAgeFilter] = useState<string>('');
  const [yearFilter, setYearFilter] = useState<string>('');

  // Fetch trending movies
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        
        // Fetch movies with high ratings and view counts
        const response = await fetch('http://localhost:3001/api/movies?limit=1000');
        const data = await response.json();
        
        if (data.success && data.data.movies) {
          const mapped: Movie[] = data.data.movies
            .filter((movie: any) => {
              // Filter movies with ratings >= 7.0 or high view counts
              const hasGoodRating = movie.external_rating && movie.external_rating >= 7.0;
              const hasViews = movie.view_count && parseInt(movie.view_count) > 0;
              return hasGoodRating || hasViews;
            })
            .map((movie: any) => ({
              id: movie.slug,
              title: movie.title,
              year: movie.release_year || 0,
              age: movie.age_rating,
              genres: movie.categories ? 
                (typeof movie.categories === 'string' && movie.categories.startsWith('[') ? 
                  JSON.parse(movie.categories).map((g: string) => getGenreDisplayName(g)) : 
                  movie.categories.split(',').map((g: string) => getGenreDisplayName(g.trim()))) : 
                (movie.genres ? movie.genres.map((g: any) => getGenreDisplayName(g.slug || g.name || g)) : []),
              poster: movie.poster_url || movie.thumbnail_url || "",
              rating: movie.external_rating || 0,
              duration: movie.duration || 0,
              overview: movie.description || ""
            }));

          setItemsAll(mapped);
        }
      } catch (error) {
        console.error('Error fetching trending movies:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Sort and filter movies
  const filteredAndSortedItems = useMemo(() => {
    let filtered = [...itemsAll];

    // Apply age filter
    if (ageFilter) {
      filtered = filtered.filter(movie => movie.age === ageFilter);
    }

    // Apply year filter
    if (yearFilter) {
      const currentYear = new Date().getFullYear();
      const year = parseInt(yearFilter);
      if (yearFilter === 'recent') {
        filtered = filtered.filter(movie => movie.year >= currentYear - 2);
      } else if (yearFilter === 'classic') {
        filtered = filtered.filter(movie => movie.year < 2010);
      } else {
        filtered = filtered.filter(movie => movie.year === year);
      }
    }

    // Sort movies
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'views':
        // Since we don't have view count in the current data structure,
        // we'll use rating as a proxy for popularity
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'trending':
      default:
        // Combine rating and recency for trending score
        filtered.sort((a, b) => {
          const scoreA = (a.rating || 0) * 0.7 + (a.year / 2025) * 0.3;
          const scoreB = (b.rating || 0) * 0.7 + (b.year / 2025) * 0.3;
          return scoreB - scoreA;
        });
        break;
    }

    // Limit to 30 movies
    return filtered.slice(0, 30);
  }, [itemsAll, sortBy, ageFilter, yearFilter]);

  // Get available years for filter
  const availableYears = useMemo(() => {
    const years = [...new Set(itemsAll.map(movie => movie.year))].sort((a, b) => b - a);
    return years.slice(0, 10); // Show last 10 years
  }, [itemsAll]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-white text-xl">Đang tải phim trending...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:text-primary-300 transition-colors duration-200"
            >
              ← Quay lại
            </button>
            <h1 className="text-4xl font-bold text-white">Phim Trending</h1>
          </div>
          <p className="text-gray-400 text-lg">
            Khám phá những bộ phim đang hot với điểm IMDB cao và lượt xem nhiều nhất
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">Sắp xếp:</span>
              <Chip active={sortBy === 'trending'} onClick={() => setSortBy('trending')}>
                Trending
              </Chip>
              <Chip active={sortBy === 'rating'} onClick={() => setSortBy('rating')}>
                Điểm cao
              </Chip>
              <Chip active={sortBy === 'views'} onClick={() => setSortBy('views')}>
                Lượt xem
              </Chip>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">Lứa tuổi:</span>
              <Chip active={ageFilter === ''} onClick={() => setAgeFilter('')}>
                Tất cả
              </Chip>
              <Chip active={ageFilter === 'P'} onClick={() => setAgeFilter('P')}>
                P
              </Chip>
              <Chip active={ageFilter === 'T13'} onClick={() => setAgeFilter('T13')}>
                T13
              </Chip>
              <Chip active={ageFilter === 'T16'} onClick={() => setAgeFilter('T16')}>
                T16
              </Chip>
              <Chip active={ageFilter === 'T18'} onClick={() => setAgeFilter('T18')}>
                T18
              </Chip>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-medium">Năm:</span>
              <Chip active={yearFilter === ''} onClick={() => setYearFilter('')}>
                Tất cả
              </Chip>
              <Chip active={yearFilter === 'recent'} onClick={() => setYearFilter('recent')}>
                Gần đây
              </Chip>
              <Chip active={yearFilter === 'classic'} onClick={() => setYearFilter('classic')}>
                Cổ điển
              </Chip>
              {availableYears.slice(0, 5).map(year => (
                <Chip
                  key={year}
                  active={yearFilter === year.toString()}
                  onClick={() => setYearFilter(year.toString())}
                >
                  {year}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-400">
            Hiển thị {filteredAndSortedItems.length} phim trending
          </p>
        </div>

        {/* Movies grid */}
        {filteredAndSortedItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
            {filteredAndSortedItems.map((movie) => (
              <TrendingPosterCard key={movie.id} m={movie} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold text-white mb-2">Không có phim nào</h3>
            <p className="text-gray-400 mb-6">
              Không tìm thấy phim trending nào phù hợp với bộ lọc của bạn.
            </p>
            <button
              onClick={() => {
                setSortBy('trending');
                setAgeFilter('');
                setYearFilter('');
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Xem tất cả phim trending
            </button>
          </div>
        )}
      </div>
    </div>
  );
}