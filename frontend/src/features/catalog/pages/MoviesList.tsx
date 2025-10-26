import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MovieService } from "../../../services/movies";
import { getGenreDisplayName, getGenreDisplayNameFromObject } from "../../../utils/genreMapper";
import { resolvePoster } from "../../../utils/imageProxy";
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

function MoviesPosterCard({ m }: { m: Movie }) {
  return (
    <PosterCard
      movie={m}
      size="medium"
      showOverlay={true}
      showGenres={true}
      showRating={true}
      showAge={true}
      showDuration={true}
    />
  );
}
/* ---------------------------- Trang phim lẻ ---------------------------- */
export default function MoviesList() {
  // dữ liệu
  const [itemsAll, setItemsAll] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        setLoading(true);
        // Gọi API backend để lấy danh sách phim lẻ
        const response = await fetch('http://localhost:3001/api/movies?is_series=false&limit=1000');
        const data = await response.json();
        
        if (!isMounted) return; // Prevent state update if component unmounted
        
        if (data.success && data.data.movies) {
          const mapped: Movie[] = data.data.movies
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
              poster: resolvePoster(movie),
              provider: "local",
              rating: movie.external_rating,
              duration: movie.duration,
              overview: movie.description,
            }))
            .sort((a: Movie, b: Movie) => (b.year || 0) - (a.year || 0)); // Sắp xếp theo năm giảm dần
          
          setItemsAll(mapped);
        } else {
          setItemsAll([]);
        }
      } catch (error) {
        console.error('Error fetching movies:', error);
        if (isMounted) {
          setItemsAll([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // state filter
  const [open, setOpen] = useState(false);
  const [type] = useState<"movie">("movie");     // trang phim lẻ nên cố định "movie"
  const [ages, setAges] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [sort, setSort] = useState<"new"|"old"|"az"|"za"|"popular">("new");

  // Pagination với "đắp từ trang sau"
  const [page, setPage] = useState(1);
  const perPage = 24; // Số phim cần hiển thị mỗi trang

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
    if (genres.length) arr = arr.filter(m => genres.some(g => m.genres.includes(g)));

    switch (sort) {
      case "new": arr = arr.sort((a,b)=> b.year - a.year); break;
      case "old": arr = arr.sort((a,b)=> a.year - b.year); break;
      case "az":  arr = arr.sort((a,b)=> a.title.localeCompare(b.title)); break;
      case "za":  arr = arr.sort((a,b)=> b.title.localeCompare(a.title)); break;
      case "popular": default: /* TODO: dựa theo view_count */ break;
    }
    return arr;
  }, [itemsAll, type, ages, years, genres, sort]);

  // Function để "đắp từ trang sau" với logging và race condition protection
  const fillPage = async (pageNum: number, capacity: number, abortSignal?: AbortSignal) => {
    const result: Movie[] = [];
    let p = pageNum;

    console.log(`[Movies] Starting fillPage: page=${pageNum}, capacity=${capacity}`);

    while (result.length < capacity) {
      if (abortSignal?.aborted) {
        console.log(`[Movies] Aborted at page ${p}`);
        throw new DOMException("aborted", "AbortError");
      }

      try {
        const response = await fetch(`http://localhost:3001/api/movies?is_series=false&page=${p}&limit=10`, {
          cache: "no-store",
          signal: abortSignal
        });
        const data = await response.json();
        const arr = data.data?.movies ?? [];
        
        console.log(`[Movies] Page ${p}: got ${arr.length} items`);
        
        if (arr.length === 0) {
          console.log(`[Movies] No more items at page ${p}, stopping`);
          break; // Hết phim
        }
        
        const mapped: Movie[] = arr
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
            poster: resolvePoster(movie),
            provider: "local",
            rating: movie.external_rating,
            duration: movie.duration,
            overview: movie.description,
          }))
          .sort((a: Movie, b: Movie) => (b.year || 0) - (a.year || 0));
        
        const need = capacity - result.length;
        const toAdd = mapped.slice(0, need);
        result.push(...toAdd);
        
        console.log(`[Movies] Added ${toAdd.length} items, total: ${result.length}/${capacity}`);
        
        p += 1; // Nhảy tiếp trang sau để "đắp"
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log(`[Movies] Request aborted at page ${p}`);
          throw error;
        }
        console.error(`[Movies] Error fetching page ${p}:`, error);
        break;
      }
    }
    
    console.log(`[Movies] FillPage complete: ${result.length}/${capacity} items`);
    return result;
  };

  // State cho items đã fill
  const [filledItems, setFilledItems] = useState<Movie[]>([]);
  const [fillingLoading, setFillingLoading] = useState(false);

  // Fill page khi page thay đổi với AbortController
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadPage = async () => {
      setFillingLoading(true);
      try {
        const items = await fillPage(page, perPage, abortController.signal);
        setFilledItems(items);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error filling page:', error);
          setFilledItems([]);
        }
      } finally {
        setFillingLoading(false);
      }
    };
    
    loadPage();
    
    return () => {
      abortController.abort();
    };
  }, [page]);

  // Áp dụng filter cho filled items
  const slice = useMemo(() => {
    let arr = filledItems.slice();
    
    if (ages.length) arr = arr.filter(m => m.age && ages.includes(m.age));
    if (years.length) arr = arr.filter(m => years.includes(m.year));
    if (genres.length) arr = arr.filter(m => genres.some(g => m.genres.includes(g)));

    switch (sort) {
      case "new": arr = arr.sort((a,b)=> b.year - a.year); break;
      case "old": arr = arr.sort((a,b)=> a.year - b.year); break;
      case "az":  arr = arr.sort((a,b)=> a.title.localeCompare(b.title)); break;
      case "za":  arr = arr.sort((a,b)=> b.title.localeCompare(a.title)); break;
      case "popular": default: break;
    }
    return arr;
  }, [filledItems, ages, years, genres, sort]);

  // Không cần scroll vì không có pagination

  const reset = () => { 
    setAges([]); 
    setYears([]); 
    setGenres([]); 
    setSort("new"); 
    setPage(1); 
  };

  /* -------------------- render -------------------- */
  return (
    <div className="w-full space-y-6 px-4 md:px-6 lg:px-8 xl:px-12">
      {/* Hero Header */}
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-500 to-yellow-500 bg-clip-text text-transparent">
          Phim Lẻ
        </h1>
        <div className="mt-2 mx-auto w-16 h-1 bg-gradient-to-r from-orange-600 via-red-500 to-yellow-500 rounded-full"></div>
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
                <span>Thể loại: {new Set(itemsAll.flatMap(m => m.genres)).size}</span>
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

            {/* Thể loại */}
            <div className="flex items-start gap-4">
              <div className="w-24 flex-shrink-0 pt-2">
                <label className="text-sm font-medium text-white/80">Thể loại:</label>
              </div>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {GENRES.map(g=>(
                  <Chip key={g} active={genres.includes(g)} onClick={()=>
                    setGenres(s => s.includes(g) ? s.filter(x=>x!==g) : [...s, g])
                  }>
                    {g}
                  </Chip>
                ))}
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
      {(loading || fillingLoading) && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent"></div>
            <span className="text-white/70">
              {loading ? 'Đang tải phim lẻ...' : 'Đang đắp từ trang sau...'}
            </span>
          </div>
        </div>
      )}

      {/* No Movies Uploaded State */}
      {!loading && itemsAll.length === 0 && (
        <div className="rounded-2xl bg-dark-800/50 p-12 text-center ring-1 ring-dark-600/50">
          <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary-500/20 flex items-center justify-center">
            <svg className="h-10 w-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12h6m-6 4h6" />
            </svg>
          </div>
          <h3 className="mb-3 text-xl font-bold text-white">Chưa có phim lẻ nào</h3>
          <p className="mb-6 text-white/70 max-w-md mx-auto">
            Hiện tại chưa có phim lẻ nào được upload lên hệ thống. 
            Vui lòng liên hệ quản trị viên để thêm nội dung.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => window.location.href = '/admin/upload-movie'}
              className="rounded-xl bg-gradient-primary px-6 py-3 font-semibold text-white hover:opacity-90 transition-all duration-200"
            >
              📤 Upload phim mới
            </button>
            <button 
              onClick={() => window.location.href = '/'}
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
            <h2 className="text-xl font-extrabold text-white font-display">Tất cả phim lẻ</h2>
            <div className="h-px flex-1 bg-gradient-to-r from-primary-500/50 to-transparent"></div>
          </div>
          
          <div 
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`
            }}
          >
            {slice.map(m => <MoviesPosterCard key={m.id} m={m} />)}
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
      {!loading && !fillingLoading && (
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
            <span className="text-white/70">∞</span>
          </div>
          
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={fillingLoading}
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
