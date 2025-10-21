import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";

// Genre type definition
interface Genre {
  id: number;
  name: string;
  slug: string;
  movie_count: number;
}

// Color palette for genres
const genreColors = [
  "bg-red-500", "bg-blue-500", "bg-pink-500", "bg-yellow-500", 
  "bg-purple-500", "bg-green-500", "bg-indigo-500", "bg-orange-500",
  "bg-gray-500", "bg-teal-500", "bg-cyan-500", "bg-violet-500",
  "bg-rose-500", "bg-emerald-500", "bg-amber-500", "bg-sky-500",
  "bg-lime-500", "bg-fuchsia-500", "bg-slate-500", "bg-stone-500",
  "bg-zinc-500"
];

// Get movies by genre from database (optimized)
const getMoviesByGenre = async (genreSlug: string) => {
  try {
    // Sử dụng endpoint mới để lấy chỉ 3 phim đầu tiên của thể loại
    const response = await fetch(`http://localhost:3001/api/movies/genre/${genreSlug}?limit=3`);
    const data = await response.json();
    
    if (data.success && data.data.movies) {
      console.log(`Genre ${genreSlug}: found ${data.data.movies.length} movies`);
      
      return data.data.movies.map((movie: any) => ({
        id: movie.slug,
        title: movie.title,
        year: movie.release_year || 0,
        duration: movie.duration || 0,
        thumbnail: movie.poster_url || movie.thumbnail_url || "",
        age: movie.age_rating,
        rating: movie.external_rating,
        genres: movie.categories ? 
          (movie.categories.startsWith('[') ? 
            JSON.parse(movie.categories) : 
            movie.categories.split(',').map((g: string) => g.trim())) : 
          []
      }));
    }
  } catch (error) {
    console.error('Error fetching movies by genre:', error);
  }
  return [];
};


function GenreCard({ genre, color }: { genre: Genre; color: string }) {
  const [movies, setMovies] = useState<any[]>([]);
  
  useEffect(() => {
    getMoviesByGenre(genre.slug).then((movieList) => {
      setMovies(movieList);
    });
  }, [genre.slug]);
  
  // Use slug directly from genre object
  const slug = genre.slug;
  
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-dark-800/50 ring-1 ring-dark-600/50 hover:ring-primary-400/50 hover:scale-105 transition-all duration-300">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20 group-hover:opacity-30 transition-opacity duration-300`} />
      
      {/* Content */}
      <div className="relative p-6">
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary-300 transition-colors duration-200">
            {genre.name}
          </h3>
          <p className="text-dark-300 text-sm">
            {genre.movie_count} phim
          </p>
        </div>
        
        {/* Sample movies */}
        <div className="flex gap-2 mb-4">
          {movies.slice(0, 3).map((movie) => (
            <div key={movie.id} className="w-12 h-16 rounded-lg overflow-hidden ring-1 ring-white/20">
              <img
                src={movie.thumbnail}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          {genre.movie_count > 3 && (
            <div className="w-12 h-16 rounded-lg bg-dark-700/50 flex items-center justify-center text-xs text-white/60">
              +{genre.movie_count - 3}
            </div>
          )}
        </div>
        
        {/* View all button */}
        <Link
          to={`/genres/${slug}`}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-500/20 px-4 py-2 text-sm font-medium text-primary-300 hover:bg-primary-500/30 transition-all duration-200"
        >
          <span>Xem tất cả</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}

export default function GenresPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch genres from API
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        console.log('=== DEBUG: Fetching genres from API ===');
        const response = await fetch('http://localhost:3001/api/genres');
        const data = await response.json();
        
        console.log('Genres API response:', data);
        
        if (data.success && data.data) {
          console.log('Genres data:', data.data);
          setGenres(data.data);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGenres();
  }, []);
  
  const filteredGenres = useMemo(() => {
    let result = genres;
    
    // Filter by search query if provided
    if (searchQuery) {
      result = result.filter(genre => 
        genre.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort by movie count (descending) then by name (ascending)
    return result.sort((a, b) => {
      if (b.movie_count !== a.movie_count) {
        return b.movie_count - a.movie_count; // Sort by movie count descending
      }
      return a.name.localeCompare(b.name); // Then by name ascending
    });
  }, [searchQuery, genres]);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-900 to-dark-800 border-b border-dark-700/50">
        <div className="w-full px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 font-display">
              Khám phá theo thể loại
            </h1>
            <p className="text-dark-300 text-lg max-w-2xl mx-auto">
              Tìm kiếm phim yêu thích của bạn từ hàng nghìn bộ phim được phân loại theo thể loại
            </p>
          </div>
          
          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm thể loại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-dark-700/50 px-4 py-3 pl-10 text-white placeholder-dark-400 border border-dark-600/50 focus:border-primary-400/50 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all duration-200"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                🔍
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Genres Grid */}
      <div className="w-full px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <h3 className="text-xl font-semibold text-white mb-2">Đang tải thể loại...</h3>
            <p className="text-dark-300">Vui lòng chờ trong giây lát</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGenres.map((genre, index) => (
                <GenreCard 
                  key={genre.id} 
                  genre={genre} 
                  color={genreColors[index % genreColors.length]}
                />
              ))}
            </div>
            
            {filteredGenres.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">Không tìm thấy thể loại</h3>
                <p className="text-dark-300">Thử tìm kiếm với từ khóa khác</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
