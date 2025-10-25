import { useState, useMemo } from "react";
import { Link } from "react-router-dom";

// Type definition for series
type SeriesItem = {
  id: number;
  title: string;
  year: number;
  seasons: number;
  episodes: string;
  genre: string;
  thumbnail: string;
  rating: number;
  views: number;
};

// Mock series data
const series: SeriesItem[] = [
  { id: 1, title: "Stranger Things", year: 2022, seasons: 4, episodes: "34 tập", genre: "Khoa học viễn tưởng", thumbnail: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=300&auto=format&fit=crop", rating: 8.7, views: 2200000 },
  { id: 2, title: "The Mandalorian", year: 2023, seasons: 3, episodes: "24 tập", genre: "Khoa học viễn tưởng", thumbnail: "https://images.unsplash.com/photo-1635322979508-8d7b5c8b5b5b?q=80&w=300&auto=format&fit=crop", rating: 8.6, views: 1900000 },
  { id: 3, title: "House of the Dragon", year: 2022, seasons: 1, episodes: "10 tập", genre: "Drama", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 8.4, views: 1700000 },
  { id: 4, title: "The Last of Us", year: 2023, seasons: 1, episodes: "9 tập", genre: "Khoa học viễn tưởng", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 9.1, views: 2500000 },
  { id: 5, title: "Wednesday", year: 2022, seasons: 1, episodes: "8 tập", genre: "Hài hước", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 8.1, views: 1600000 },
  { id: 6, title: "The Witcher", year: 2021, seasons: 3, episodes: "24 tập", genre: "Phiêu lưu", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 7.5, views: 1500000 },
  { id: 7, title: "Bridgerton", year: 2022, seasons: 2, episodes: "16 tập", genre: "Tình cảm", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 7.8, views: 1400000 },
  { id: 8, title: "The Crown", year: 2022, seasons: 5, episodes: "50 tập", genre: "Drama", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 8.2, views: 1300000 },
  { id: 9, title: "Money Heist", year: 2021, seasons: 5, episodes: "41 tập", genre: "Hành động", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 8.3, views: 1800000 },
  { id: 10, title: "Squid Game", year: 2021, seasons: 1, episodes: "9 tập", genre: "Kinh dị", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 8.0, views: 2000000 },
  { id: 11, title: "Ozark", year: 2022, seasons: 4, episodes: "44 tập", genre: "Drama", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 8.1, views: 1200000 },
  { id: 12, title: "The Queen's Gambit", year: 2020, seasons: 1, episodes: "7 tập", genre: "Drama", thumbnail: "https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=300&auto=format&fit=crop", rating: 8.5, views: 1100000 }
];

const genres = ["Tất cả", "Khoa học viễn tưởng", "Drama", "Hài hước", "Phiêu lưu", "Tình cảm", "Hành động", "Kinh dị"];

function SeriesCard({ series }: { series: SeriesItem }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-dark-800/50 ring-1 ring-dark-600/50 hover:ring-primary-400/50 hover:scale-105 transition-all duration-300">
      <div className="relative">
        <img
          src={series.thumbnail}
          alt={series.title}
          className="aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            to={`/watch/series/${series.id}`}
            className="rounded-full bg-primary-500/90 p-3 backdrop-blur hover:bg-primary-400 transition-colors duration-200"
          >
            <span className="text-white text-lg">▶</span>
          </Link>
        </div>
        
        {/* Rating */}
        <div className="absolute top-2 right-2 rounded-full bg-dark-800/80 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
          ⭐ {series.rating}
        </div>
        
        {/* Series badge */}
        <div className="absolute top-2 left-2 rounded-full bg-accent-500/90 px-2 py-1 text-xs font-bold text-white">
          📺 Series
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-primary-300 transition-colors duration-200">
          {series.title}
        </h3>
        <div className="flex items-center justify-between text-sm text-dark-300 mb-2">
          <span>{series.year}</span>
          <span>{series.episodes}</span>
        </div>
        <div className="text-xs text-primary-300 mb-1">
          {series.genre}
        </div>
        <div className="text-xs text-dark-400 mb-1">
          {series.seasons} mùa • {series.views.toLocaleString()} lượt xem
        </div>
      </div>
    </div>
  );
}

export default function SeriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("Tất cả");
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'views'>('newest');
  
  const filteredSeries = useMemo(() => {
    let filtered = series;
    
    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(series =>
        series.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by genre
    if (selectedGenre !== "Tất cả") {
      filtered = filtered.filter(series => series.genre === selectedGenre);
    }
    
    // Sort
    switch (sortBy) {
      case 'newest':
        filtered = filtered.sort((a, b) => b.year - a.year);
        break;
      case 'rating':
        filtered = filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'views':
        filtered = filtered.sort((a, b) => b.views - a.views);
        break;
    }
    
    return filtered;
  }, [searchQuery, selectedGenre, sortBy]);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-900 to-dark-800 border-b border-dark-700/50">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 font-display">
              📺 Phim bộ
            </h1>
            <p className="text-dark-300 text-lg max-w-2xl mx-auto">
              Khám phá bộ sưu tập phim bộ đa dạng với nhiều mùa và tập
            </p>
          </div>
          
          {/* Search */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm phim bộ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-dark-700/50 px-4 py-3 pl-10 text-white placeholder-dark-400 border border-dark-600/50 focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all duration-200"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                🔍
              </div>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* Genre filter */}
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    selectedGenre === genre
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-600/50'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            
            {/* Sort */}
            <div className="flex rounded-xl bg-dark-700/50 p-1">
              {(['newest', 'rating', 'views'] as const).map((sort) => (
                <button
                  key={sort}
                  onClick={() => setSortBy(sort)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    sortBy === sort
                      ? 'bg-primary-500 text-white'
                      : 'text-dark-300 hover:text-white hover:bg-dark-600/50'
                  }`}
                >
                  {sort === 'newest' ? 'Mới nhất' : sort === 'rating' ? 'Đánh giá' : 'Lượt xem'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {filteredSeries.length} phim bộ được tìm thấy
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredSeries.map((series) => (
            <SeriesCard key={series.id} series={series} />
          ))}
        </div>
        
        {filteredSeries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-semibold text-white mb-2">Không tìm thấy phim bộ</h3>
            <p className="text-dark-300">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        )}
      </div>
    </div>
  );
}