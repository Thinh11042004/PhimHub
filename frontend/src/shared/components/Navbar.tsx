import { useState, useEffect, useRef, useCallback } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { useUI } from "../../store/ui";
import { MovieService } from "../../services/movies";
import { getAvatarUrlWithFallback } from "../../utils/avatarUtils";
import defaultAvatar from "../../assets/avatar.jpg";
import logo from "../../assets/logo2.png";

function NavItem({ to, children, isScrolled }: { to: string; children: React.ReactNode; isScrolled: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-full px-3 py-1.5 text-base font-medium text-white transition-all duration-200 ${
          isActive 
            ? "bg-red-500 text-white shadow-lg font-semibold" 
            : isScrolled 
              ? "bg-white/10 hover:bg-purple-500 hover:text-white backdrop-blur-sm"
              : "bg-transparent hover:bg-purple-500 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Navbar() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; img: string; isSeries?: boolean }>>([]);
  const [searching, setSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);
  const { user, logout, refreshUser } = useAuth();
  const { openAuth } = useUI();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Track scroll for navbar background
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((keyword: string) => {
    const newRecent = [keyword, ...recentSearches.filter(s => s !== keyword)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recentSearches', JSON.stringify(newRecent));
  }, [recentSearches]);

  // Debounced search function
  const performSearch = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setSearching(true);
    setShowSearchDropdown(true);
    
    try {
      // Gọi API backend để tìm kiếm phim thực tế
      const response = await fetch(`http://localhost:3001/api/movies/search?q=${encodeURIComponent(keyword)}&limit=8`);
      const data = await response.json();

      if (data.success && data.data) {
        const movies = Array.isArray(data.data) ? data.data : data.data.movies || [];
        const results = movies.map((movie: any) => ({
          id: movie.slug || movie.id,
          title: movie.title,
          img: movie.poster_url || movie.banner_url || "",
          isSeries: movie.is_series || false,
        }));
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced search with 300ms delay
  const debouncedSearch = useCallback((keyword: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(keyword);
    }, 300);
  }, [performSearch]);

  const handleSearchInput = (value: string) => {
    setQ(value);
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const keyword = q.trim();
    if (!keyword) return;
    
    saveRecentSearch(keyword);
    performSearch(keyword);
  };

  const handleResultClick = (result: { id: string; title: string; isSeries?: boolean }) => {
    saveRecentSearch(result.title);
    nav(`${result.isSeries ? "/series" : "/movies"}/${result.id}?provider=local`);
    setShowSearchDropdown(false);
    setQ("");
    setSearchResults([]);
  };

  const handleRecentSearchClick = (search: string) => {
    setQ(search);
    saveRecentSearch(search);
    performSearch(search);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowDropdown(false);
      nav('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    if (showDropdown || showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, showSearchDropdown]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Listen for avatar updates
  useEffect(() => {
    const handleAvatarUpdate = () => {
      if (user) {
        refreshUser();
      }
    };

    // Listen for custom avatar update event
    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [user, refreshUser]);

  return (
    <header 
      className="sticky top-0 z-[100] transition-all duration-300"
      style={{
        backgroundColor: isScrolled ? 'rgba(0, 0, 17, 0.95)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(12px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(71, 85, 105, 0.5)' : '1px solid transparent',
        boxShadow: isScrolled ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)' : 'none'
      }}
    >
      <div className={`flex w-full items-center gap-3 pl-6 pr-3 py-2 md:pl-8 md:pr-4 transition-all duration-300 ${
        isScrolled ? '' : 'bg-transparent'
      }`}>
        {/* LOGO */}
        <Link to="/" className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="PhimHub" 
            className={`h-12 w-12 rounded-full transition-all duration-300 ${
              isScrolled 
                ? 'shadow-lg ring-1 ring-primary-500/30' 
                : 'shadow-none ring-0'
            }`} 
          />
          <span className="hidden text-xl font-bold tracking-wide text-white md:block font-display">PhimHub</span>
        </Link>

        {/* MENU */}
        <nav className="hidden items-center gap-2 md:flex">
          <NavItem to="/genres" isScrolled={isScrolled}>Thể loại</NavItem>
          <NavItem to="/trending" isScrolled={isScrolled}>Trending</NavItem>
          <NavItem to="/movies" isScrolled={isScrolled}>Phim lẻ</NavItem>
          <NavItem to="/series" isScrolled={isScrolled}>Phim bộ</NavItem>
          <NavItem to="/actors" isScrolled={isScrolled}>Diễn viên</NavItem>
          <NavItem to="/directors" isScrolled={isScrolled}>Đạo diễn</NavItem>
        </nav>

        {/* SEARCH */}
        <div className="ml-auto relative mr-8" ref={searchRef}>
          <form
            onSubmit={handleSearchSubmit}
            className="flex w-48 items-center rounded-lg bg-white/10 backdrop-blur-sm focus-within:ring-2 focus-within:ring-primary-500/60 transition-all duration-200 sm:w-72 md:w-96"
          >
            <input
              value={q}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => {
                if (q.length >= 2) {
                  setShowSearchDropdown(true);
                } else if (recentSearches.length > 0) {
                  setShowSearchDropdown(true);
                }
              }}
              placeholder="Tìm kiếm phim, diễn viên"
              className="w-full bg-transparent text-base font-bold text-white outline-none placeholder:text-white px-4 py-3"
              aria-label="Tìm kiếm"
            />
            <button 
              type="submit"
              className="text-white hover:text-white transition-colors pr-4" 
              aria-label="Tìm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Search Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-xl bg-dark-800/95 backdrop-blur border border-dark-600/50 shadow-xl z-[110] max-h-96 overflow-hidden">
              {searching && (
                <div className="px-4 py-6 text-center">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                  <p className="mt-2 text-sm text-white/60">Đang tìm kiếm...</p>
                </div>
              )}

              {!searching && q.length < 2 && recentSearches.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-medium text-white/60 uppercase tracking-wide">Tìm kiếm gần đây</div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentSearchClick(search)}
                      className="w-full px-2 py-2 text-left text-base text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <span className="text-white/40">🕒</span>
                      {search}
                    </button>
                  ))}
                </div>
              )}

              {!searching && q.length >= 2 && searchResults.length > 0 && (
                <div className="p-2">
                  <div className="px-2 py-1 text-xs font-medium text-white/60 uppercase tracking-wide">
                    Kết quả tìm kiếm ({searchResults.length})
                  </div>
                  <div className="grid grid-cols-1 gap-1">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleResultClick(result)}
                        className="w-full px-2 py-2 text-left hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                      >
                        <img 
                          src={result.img} 
                          alt={result.title}
                          className="w-8 h-12 object-cover rounded"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-base text-white truncate">{result.title}</div>
                          <div className="text-xs text-white/60">
                            {result.isSeries ? 'Phim bộ' : 'Phim lẻ'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!searching && q.length >= 2 && searchResults.length === 0 && (
                <div className="px-4 py-6 text-center">
                  <div className="text-4xl mb-2">🔍</div>
                  <p className="text-sm text-white/60">Không tìm thấy kết quả nào</p>
                  <p className="text-xs text-white/40 mt-1">Thử tìm kiếm với từ khóa khác</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* AUTH */}
        {user ? (
          <div className="relative -ml-2" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              title={user.username || "Tài khoản"}
              className={`h-11 w-11 overflow-hidden rounded-full transition-all duration-200 shadow-lg ${
                isScrolled 
                  ? 'ring-1 ring-white/20 hover:ring-white/40 backdrop-blur-sm' 
                  : 'ring-1 ring-transparent hover:ring-white/20'
              }`}
            >
              <img
                src={getAvatarUrlWithFallback(user.avatar, defaultAvatar)}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = defaultAvatar;
                }}
                alt={user.username || "avatar"}
                className="h-full w-full object-cover"
              />
            </button>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 top-16 w-56 rounded-2xl bg-slate-800 border border-slate-600 py-3 shadow-2xl z-[110]">
                {/* User Info Header */}
                <div className="px-5 py-3 border-b border-slate-600">
                  <div className="font-semibold text-white text-lg">{user.username}</div>
                  <div className="text-sm text-slate-400 mt-0.5">{user.email}</div>
                </div>
                
                {/* Menu Items */}
                <div className="py-2">
                  {user.role === 'admin' ? (
                    // Admin Menu
                    <>
                      <button
                        onClick={() => {
                          nav('/admin');
                          setShowDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-white hover:bg-slate-800/80 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-medium">Tổng quan</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          nav('/admin/genres');
                          setShowDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-white hover:bg-slate-800/80 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="font-medium">Thể loại</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          nav('/admin/users');
                          setShowDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-white hover:bg-slate-800/80 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-yellow-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                        <span className="font-medium">Người dùng</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          nav('/admin/movies');
                          setShowDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-white hover:bg-slate-800/80 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h3a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1h3zM9 4h6M9 8h6M9 12h6" />
                        </svg>
                        <span className="font-medium">Upload phim lẻ</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          nav('/admin/series');
                          setShowDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-white hover:bg-slate-800/80 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span className="font-medium">Upload phim bộ</span>
                      </button>
                    </>
                  ) : (
                    // User Menu
                    <>
                      <button
                        onClick={() => {
                          nav('/account');
                          setShowDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-white hover:bg-slate-800/80 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">Tài khoản</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          nav('/account/favorites');
                          setShowDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-white hover:bg-slate-800/80 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span className="font-medium">Yêu thích</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          nav('/account/history');
                          setShowDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-white hover:bg-slate-800/80 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Đã xem</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          nav('/account/lists');
                          setShowDropdown(false);
                        }}
                        className="w-full px-5 py-3 text-left text-white hover:bg-slate-800/80 transition-all duration-200 flex items-center gap-3 group"
                      >
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <span className="font-medium">Danh sách</span>
                      </button>
                    </>
                  )}
                </div>
                
                {/* Divider */}
                <div className="border-t border-slate-600 my-2"></div>
                
                {/* Logout */}
                <div className="py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-3 text-left text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 flex items-center gap-3 group"
                  >
                    <svg className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="font-medium">Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="ml-2 flex items-center gap-2">
            <button
              onClick={() => openAuth("login")}
              className={`rounded-full px-3 py-1.5 text-base text-white transition-all duration-200 ${
                isScrolled 
                  ? 'bg-white/10 backdrop-blur-sm hover:bg-white/20' 
                  : 'bg-transparent hover:bg-white/10'
              } hover:text-primary-300`}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => openAuth("register")}
              className={`rounded-full px-3 py-1.5 text-base font-medium text-white hover:opacity-90 transition-all duration-200 shadow-lg ${
                isScrolled 
                  ? 'bg-gradient-primary backdrop-blur-sm' 
                  : 'bg-gradient-primary'
              }`}
            >
              Đăng ký
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
