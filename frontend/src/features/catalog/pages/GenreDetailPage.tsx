import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { MovieService } from "../../../services/movies";
import { getGenreDisplayName, getGenreDisplayNameFromObject } from "../../../utils/genreMapper";
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
function GenrePosterCard({ m }: { m: Movie }) {
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
        overview: undefined
      }}
      size="medium"
      showRating={true}
      showAge={true}
      showDuration={true}
      showGenres={true}
      showOverlay={true}
      showActions={true}
    />
  );
}

/* ---------------------------- Trang phim theo thể loại ---------------------------- */
export default function GenreDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  // dữ liệu
  const [itemsAll, setItemsAll] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [genreName, setGenreName] = useState<string>("");
  const [genreInfo, setGenreInfo] = useState<any>(null);

  // Convert slug back to genre name
  const getGenreNameFromSlug = (slug: string) => {
    const slugToGenreMapping: { [key: string]: string } = {
      'am-nhac': 'Âm nhạc',
      'bi-an': 'Bí ẩn', 
      'chien-tranh': 'Chiến tranh',
      'chinh-kich': 'Chính kịch',
      'co-trang': 'Cổ trang',
      'gia-dinh': 'Gia đình',
      'hai-huoc': 'Hài hước',
      'hanh-dong': 'Hành động',
      'hinh-su': 'Hình sự',
      'hoat-hinh': 'Hoạt hình',
      'hoc-duong': 'Học đường',
      'khoa-hoc': 'Khoa học',
      'kinh-di': 'Kinh dị',
      'lich-su': 'Lịch sử',
      'mien-tay': 'Miền Tây',
      'phieu-luu': 'Phiêu lưu',
      'tai-lieu': 'Tài liệu',
      'tam-ly': 'Tâm lý',
      'tinh-cam': 'Tình cảm',
      'trung-quoc': 'Trung Quốc',
      'vien-tuong': 'Viễn tưởng'
    };
    
    return slugToGenreMapping[slug] || slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  useEffect(() => {
    if (!slug) return;
    
    (async () => {
      try {
        setLoading(true);
        
        // Get genre info from API
        const genreResponse = await fetch('http://localhost:3001/api/genres');
        const genreData = await genreResponse.json();
        
        if (genreData.success && genreData.data) {
          // Find genre by slug
          const foundGenre = genreData.data.find((g: any) => 
            g.slug === slug
          );
          
          if (foundGenre) {
            setGenreName(foundGenre.name);
            setGenreInfo(foundGenre);
          } else {
            // Fallback: use slug as genre name
            setGenreName(getGenreNameFromSlug(slug));
          }
        }
        
        // Gọi API backend để lấy danh sách phim theo thể loại (sử dụng endpoint mới)
        const response = await fetch(`http://localhost:3001/api/movies/genre/${slug}?limit=100`);
        const data = await response.json();
        
        if (data.success && data.data.movies) {
          console.log("Total movies from API:", data.data.movies.length);
          
          const mapped: Movie[] = data.data.movies.map((movie: any) => ({
            id: movie.slug,
            title: movie.title,
            year: movie.release_year || 0,
            age: movie.age_rating,
            genres: movie.categories ? 
              (movie.categories.startsWith('[') ? 
                JSON.parse(movie.categories).map((g: string) => getGenreDisplayName(g)) : 
                movie.categories.split(',').map((g: string) => getGenreDisplayName(g.trim()))) : 
              [],
            poster: movie.poster_url || movie.thumbnail_url || "",
            provider: "local",
            rating: movie.external_rating,
            duration: movie.duration,
            overview: movie.description,
          }));
          
          console.log("Mapped movies count:", mapped.length);
          setItemsAll(mapped);
        } else {
          setItemsAll([]);
        }
      } catch (error) {
        console.error('Error fetching movies by genre:', error);
        setItemsAll([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, genreName]);

  // state filter
  const [open, setOpen] = useState(false);
  const [ages, setAges] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [sort, setSort] = useState<"new"|"old"|"az"|"za"|"popular">("new");

  // phân trang
  const [page, setPage] = useState(1);
  const perPage = 24;

  // tính list năm hiển thị filter
  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    const arr: number[] = [];
    for (let y = now; y >= now - 20; y--) arr.push(y);
    return arr;
  }, []);

  // áp filter
  const filtered = useMemo(() => {
    let arr = itemsAll.slice();
    
    if (ages.length) arr = arr.filter(m => m.age && ages.includes(m.age));
    if (years.length) arr = arr.filter(m => years.includes(m.year));

    switch (sort) {
      case "new": arr = arr.sort((a,b)=> b.year - a.year); break;
      case "old": arr = arr.sort((a,b)=> a.year - b.year); break;
      case "az":  arr = arr.sort((a,b)=> a.title.localeCompare(b.title)); break;
      case "za":  arr = arr.sort((a,b)=> b.title.localeCompare(a.title)); break;
      case "popular": default: /* TODO: dựa theo view_count */ break;
    }
    return arr;
  }, [itemsAll, ages, years, sort]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / perPage));
  useEffect(()=>{ if(page>maxPage) setPage(maxPage) }, [maxPage, page]);
  const slice = filtered.slice((page-1)*perPage, page*perPage);

  // Auto-scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const reset = () => { 
    setAges([]); 
    setYears([]); 
    setSort("new"); 
    setPage(1); 
  };

  /* -------------------- render -------------------- */
  return (
    <div className="w-full space-y-6 px-4 md:px-6 lg:px-8 xl:px-12">
      {/* Hero Header */}
      <div className="text-center py-12">
        <div className="mb-4">
          <Link 
            to="/genres" 
            className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại thể loại
          </Link>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-yellow-500 bg-clip-text text-transparent">
          {genreName || "Thể loại"}
        </h1>
        <div className="mt-2 mx-auto w-16 h-1 bg-gradient-to-r from-orange-600 via-red-500 to-yellow-500 rounded-full"></div>
        {genreInfo && (
          <p className="mt-4 text-lg text-white/70">
            {genreInfo.movie_count} phim
          </p>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
          <div className="text-sm text-white/70">
            Hiển thị <span className="font-semibold text-white">{filtered.length}</span> phim
          </div>
          
          {/* Quick Stats */}
          {itemsAll.length > 0 && (
            <div className="flex items-center gap-4 text-xs text-white/50">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Mới nhất: {Math.max(...itemsAll.map(m => m.year))}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Cũ nhất: {Math.min(...itemsAll.map(m => m.year))}</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setOpen(o => !o)} 
            className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 hover:bg-white/15 transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            {open ? "Ẩn bộ lọc" : "Bộ lọc"}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {open && (
        <div className="rounded-2xl bg-dark-800/50 p-6 ring-1 ring-dark-600/50 backdrop-blur-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Bộ lọc</h3>
            <button 
              onClick={() => setOpen(false)}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15 transition-all duration-200"
            >
              Đóng
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Sắp xếp */}
            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0 pt-2">
                <label className="text-sm font-medium text-white/80">Sắp xếp:</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {k:"new",label:"Mới nhất"},
                  {k:"old",label:"Cũ nhất"},
                  {k:"az",label:"A→Z"},
                  {k:"za",label:"Z→A"},
                  {k:"popular",label:"Phổ biến"},
                ].map(o=>(
                  <Chip key={o.k} active={sort===o.k} onClick={()=>setSort(o.k as any)}>{o.label}</Chip>
                ))}
              </div>
            </div>

            {/* Lứa tuổi */}
            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0 pt-2">
                <label className="text-sm font-medium text-white/80">Xếp hạng:</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  {k:"P",label:"P (Mọi lứa tuổi)"},
                  {k:"13+",label:"T13 (13 tuổi trở lên)"},
                  {k:"16+",label:"T16 (16 tuổi trở lên)"},
                  {k:"18+",label:"T18 (18 tuổi trở lên)"},
                ].map(a=>(
                  <Chip key={a.k} active={ages.includes(a.k)} onClick={()=>
                    setAges(s => s.includes(a.k) ? s.filter(x=>x!==a.k) : [...s, a.k])
                  }>
                    {a.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Năm sản xuất */}
            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0 pt-2">
                <label className="text-sm font-medium text-white/80">Năm sản xuất:</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {yearOptions.slice(0, 10).map(y=>(
                  <Chip key={y} active={years.includes(y)} onClick={()=>
                    setYears(s => s.includes(y) ? s.filter(x=>x!==y) : [...s, y])
                  }>
                    {y}
                  </Chip>
                ))}
                <div className="flex items-center gap-2 ml-4">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Nhập năm"
                      className="w-32 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/50 ring-1 ring-white/20 focus:ring-primary-400/50 focus:outline-none"
                      min="1900"
                      max="2030"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const year = parseInt((e.target as HTMLInputElement).value);
                          if (year >= 1900 && year <= 2030) {
                            setYears(s => s.includes(year) ? s.filter(x=>x!==year) : [...s, year]);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <svg className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 flex items-center justify-end gap-3">
            <button 
              onClick={reset}
              className="rounded-lg bg-white/10 px-6 py-2 text-sm font-medium text-white hover:bg-white/15 transition-all duration-200"
            >
              Bỏ lọc
            </button>
            <button 
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-2 text-sm font-medium text-white hover:from-primary-400 hover:to-primary-500 transition-all duration-200"
            >
              Lọc kết quả
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
            <span className="text-white/70">Đang tải phim...</span>
          </div>
        </div>
      )}

      {/* No Movies State */}
      {!loading && itemsAll.length === 0 && (
        <div className="rounded-2xl bg-dark-800/50 p-12 text-center ring-1 ring-dark-600/50">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary-500/20 flex items-center justify-center">
            <svg className="h-10 w-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12h6m-6 4h6" />
            </svg>
          </div>
          <h3 className="mb-3 text-xl font-bold text-white">Không có phim nào</h3>
          <p className="mb-6 text-white/70 max-w-md mx-auto">
            Hiện tại chưa có phim nào thuộc thể loại "{genreName}". 
            Vui lòng quay lại trang thể loại để xem các thể loại khác.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => navigate('/genres')}
              className="rounded-xl bg-gradient-primary px-6 py-3 font-semibold text-white hover:opacity-90 transition-all duration-200"
            >
              🎬 Xem thể loại khác
            </button>
            <button 
              onClick={() => navigate('/')}
              className="rounded-xl bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/15 transition-all duration-200"
            >
              🏠 Về trang chủ
            </button>
          </div>
        </div>
      )}

      {/* Movies Grid */}
      {!loading && filtered.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-white font-display">Phim {genreName}</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-primary-500/50 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-7 gap-6 justify-items-center">
            {slice.map(m => <GenrePosterCard key={m.id} m={m} />)}
            {/* Thêm placeholder để đảm bảo dòng cuối có đủ 7 phim */}
            {Array.from({ length: (7 - (slice.length % 7)) % 7 }).map((_, index) => (
              <div key={`placeholder-${index}`} className="w-full" />
            ))}
          </div>
        </section>
      )}

      {/* No Results State */}
      {!loading && filtered.length === 0 && itemsAll.length > 0 && (
        <div className="rounded-2xl bg-dark-800/50 p-12 text-center ring-1 ring-dark-600/50">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="h-8 w-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">Không tìm thấy phim nào</h3>
          <p className="text-white/70">Hãy thử thay đổi tiêu chí tìm kiếm hoặc bộ lọc</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && maxPage > 1 && (
        <div className="flex items-center justify-center gap-3 py-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white/70">
              {page}
            </div>
            <span className="text-white/50">/</span>
            <span className="text-white/70">{maxPage}</span>
          </div>
          
          <button
            onClick={() => setPage(p => Math.min(maxPage, p + 1))}
            disabled={page === maxPage}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
