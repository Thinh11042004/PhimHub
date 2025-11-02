import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../store/auth';
import { favoritesApi, FavoriteItem } from '../../../services/favorites';
import { watchHistoryService, WatchHistoryItem } from '../../../services/watchHistory';
import { customListsService, CustomList } from '../../../services/customLists';
import ErrorBoundary from '../../../shared/components/ErrorBoundary';
import PosterCard from '../../../shared/components/PosterCard';
import { getImageUrl } from '../../../utils/imageProxy';

// Types
type ListType = 'favorites' | 'history' | 'custom';
type SortOption = 'recent' | 'title' | 'year' | 'rating';

interface ListStats {
  total: number;
  movies: number;
  series: number;
  lastUpdated: string;
}

interface FilterState {
  type: 'all' | 'movie' | 'series';
  search: string;
  sort: SortOption;
}

// Utility functions
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Vừa xong';
  if (diffInHours < 24) return `${diffInHours} giờ trước`;
  if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

// Common interface for items
interface CommonItem {
  id: string | number;
  title: string;
  year?: number;
  poster?: string;
  poster_url?: string;
  duration?: number;
  rating?: number;
  age?: string;
  age_rating?: string;
  is_series: boolean;
  slug?: string;
  overview?: string;
}

// Type guards
const isFavoriteItem = (item: FavoriteItem | WatchHistoryItem): item is FavoriteItem => {
  return 'favorited_at' in item;
};

const isWatchHistoryItem = (item: FavoriteItem | WatchHistoryItem): item is WatchHistoryItem => {
  return 'last_watched_at' in item;
};

// Helper function to get common properties
const getCommonItem = (item: FavoriteItem | WatchHistoryItem): CommonItem => {
  return {
    id: item.id,
    title: item.title || '',
    year: (item as any).year,
    poster: (item as any).poster,
    poster_url: (item as any).poster_url,
    duration: (item as any).duration,
    rating: (item as any).rating,
    age: (item as any).age,
    age_rating: (item as any).age_rating,
    is_series: (item as any).is_series,
    slug: (item as any).slug,
    overview: (item as any).overview
  };
};

const getListStats = (items: (FavoriteItem | WatchHistoryItem)[]): ListStats => {
  const movies = items.filter(item => {
    const common = getCommonItem(item);
    return !common.is_series;
  }).length;
  const series = items.filter(item => {
    const common = getCommonItem(item);
    return common.is_series;
  }).length;
  const lastUpdated = items.length > 0 
    ? items.reduce((latest, item) => {
        const itemDate = new Date(
          isWatchHistoryItem(item) ? item.last_watched_at : 
          isFavoriteItem(item) ? (item as any).favorited_at : ''
        );
        const latestDate = new Date(latest);
        return itemDate > latestDate ? itemDate.toISOString() : latest;
      }, isWatchHistoryItem(items[0]) ? items[0].last_watched_at : 
          isFavoriteItem(items[0]) ? (items[0] as any).favorited_at : '')
    : new Date().toISOString();

  return {
    total: items.length,
    movies,
    series,
    lastUpdated
  };
};

const getCustomListsStats = (lists: CustomList[]): ListStats => {
  const totalItems = lists.reduce((sum, list) => sum + list.itemCount, 0);
  const lastUpdated = lists.length > 0 
    ? lists.reduce((latest, list) => {
        const listDate = new Date(list.updatedAt);
        const latestDate = new Date(latest);
        return listDate > latestDate ? listDate.toISOString() : latest;
      }, lists[0].updatedAt)
    : new Date().toISOString();

  return {
    total: totalItems,
    movies: 0, // We don't have this breakdown in the current API
    series: 0, // We don't have this breakdown in the current API
    lastUpdated
  };
};

// Components
const StatsCard: React.FC<{ title: string; stats: ListStats; icon: React.ReactNode; color: string }> = ({ 
  title, 
  stats, 
  icon, 
  color 
}) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white relative overflow-hidden`}>
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          {icon}
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-white/80 text-sm">tổng cộng</div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      
      <div className="flex justify-between text-sm text-white/90">
        <span>{stats.movies} phim lẻ</span>
        <span>{stats.series} phim bộ</span>
      </div>
      
      <div className="mt-3 text-xs text-white/70">
        Cập nhật: {formatDate(stats.lastUpdated)}
      </div>
    </div>
    
    {/* Background decoration */}
    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
    <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
  </div>
);

const FilterBar: React.FC<{
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}> = ({ filters, onFiltersChange }) => (
  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 ring-1 ring-white/10">
    <div className="flex flex-wrap items-center gap-4">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm phim..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 pl-10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Type filter */}
      <select
        value={filters.type}
        onChange={(e) => onFiltersChange({ ...filters, type: e.target.value as any })}
        className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <option value="all">Tất cả</option>
        <option value="movie">Phim lẻ</option>
        <option value="series">Phim bộ</option>
      </select>

      {/* Sort */}
      <select
        value={filters.sort}
        onChange={(e) => onFiltersChange({ ...filters, sort: e.target.value as any })}
        className="bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
      >
        <option value="recent">Gần đây</option>
        <option value="title">Tên A-Z</option>
        <option value="year">Năm</option>
        <option value="rating">Đánh giá</option>
      </select>

    </div>
  </div>
);

const EmptyState: React.FC<{ type: ListType; onAction?: () => void }> = ({ type, onAction }) => {
  const getContent = () => {
    switch (type) {
      case 'favorites':
        return {
          icon: (
            <svg className="w-16 h-16 text-white/40" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          ),
          title: 'Chưa có phim yêu thích',
          description: 'Hãy thêm những bộ phim bạn yêu thích để dễ dàng tìm lại sau này.',
          actionText: 'Khám phá phim',
          actionLink: '/'
        };
      case 'history':
        return {
          icon: (
            <svg className="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: 'Chưa có lịch sử xem',
          description: 'Lịch sử xem phim của bạn sẽ được lưu tự động khi bạn xem phim.',
          actionText: 'Xem phim ngay',
          actionLink: '/'
        };
      default:
        return {
          icon: (
            <svg className="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
          title: 'Danh sách trống',
          description: 'Tạo danh sách tùy chỉnh để tổ chức phim theo sở thích của bạn.',
          actionText: 'Tạo danh sách',
          actionLink: '/lists'
        };
    }
  };

  const content = getContent();

  return (
    <div className="text-center py-16">
      <div className="mb-6">{content.icon}</div>
      <h3 className="text-2xl font-semibold text-white mb-3">{content.title}</h3>
      <p className="text-white/70 mb-8 max-w-md mx-auto">{content.description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {content.actionText}
        </button>
      )}
    </div>
  );
};

// Main component
export default function MyLists() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<ListType>('favorites');
  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    search: '',
    sort: 'recent'
  });
  
  // Data state
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const userId = parseInt(user.id);
        
        // Load favorites
        const favoritesData = await favoritesApi.getFavorites();
        setFavorites(favoritesData);
        
        // Load watch history
        const historyData = await watchHistoryService.getHistory(userId);
        setHistory(historyData);
        
        // Load custom lists
        const customListsData = await customListsService.getUserLists();
        setCustomLists(customListsData);
        
      } catch (err) {
        console.error('Failed to load lists:', err);
        setError('Không thể tải danh sách. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Get current data based on active tab
  const currentData = useMemo(() => {
    switch (activeTab) {
      case 'favorites':
        return favorites;
      case 'history':
        return history;
      case 'custom':
        return []; // Custom lists are handled separately
      default:
        return [];
    }
  }, [activeTab, favorites, history]);

  // Filter and sort data for favorites and history
  const filteredData = useMemo(() => {
    let data = [...currentData];
    
    // Type filter
    if (filters.type !== 'all') {
      data = data.filter(item => {
        const common = getCommonItem(item);
        return filters.type === 'movie' ? !common.is_series : common.is_series;
      });
    }
    
    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      data = data.filter(item => {
        const common = getCommonItem(item);
        return common.title?.toLowerCase().includes(searchTerm);
      });
    }
    
    // Sort
    switch (filters.sort) {
      case 'title':
        data.sort((a, b) => {
          const aCommon = getCommonItem(a);
          const bCommon = getCommonItem(b);
          return (aCommon.title || '').localeCompare(bCommon.title || '');
        });
        break;
      case 'year':
        data.sort((a, b) => {
          const aCommon = getCommonItem(a);
          const bCommon = getCommonItem(b);
          return (bCommon.year || 0) - (aCommon.year || 0);
        });
        break;
      case 'rating':
        data.sort((a, b) => {
          const aCommon = getCommonItem(a);
          const bCommon = getCommonItem(b);
          return (bCommon.rating || 0) - (aCommon.rating || 0);
        });
        break;
      default: // recent
        data.sort((a, b) => {
          const aDate = new Date(
            isWatchHistoryItem(a) ? a.last_watched_at : 
            isFavoriteItem(a) ? (a as any).favorited_at : ''
          );
          const bDate = new Date(
            isWatchHistoryItem(b) ? b.last_watched_at : 
            isFavoriteItem(b) ? (b as any).favorited_at : ''
          );
          return bDate.getTime() - aDate.getTime();
        });
    }
    
    return data;
  }, [currentData, filters]);

  // Filter and sort custom lists
  const filteredCustomLists = useMemo(() => {
    let data = [...customLists];
    
    // Search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      data = data.filter(list => 
        list.name?.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort custom lists
    switch (filters.sort) {
      case 'title':
        data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'year':
        data.sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0));
        break;
      case 'rating':
        data.sort((a, b) => (b.itemCount || 0) - (a.itemCount || 0));
        break;
      default: // recent
        data.sort((a, b) => {
          const aDate = new Date(a.updatedAt);
          const bDate = new Date(b.updatedAt);
          return bDate.getTime() - aDate.getTime();
        });
    }
    
    return data;
  }, [customLists, filters]);

  // Get stats for current tab
  const stats = useMemo(() => getListStats(currentData), [currentData]);

  // Actions
  const handleRemoveFromFavorites = async (id: string, type: 'movie' | 'series') => {
    try {
      await favoritesApi.removeFromFavorites(id, type);
      setFavorites(prev => prev.filter(item => !(item.id === id && item.type === type)));
    } catch (error) {
      console.error('Failed to remove from favorites:', error);
      alert('Không thể xóa khỏi yêu thích. Vui lòng thử lại.');
    }
  };

  const handleRemoveFromHistory = async (id: number) => {
    if (!user) return;
    
    try {
      // This would need to be implemented in the service
      // await watchHistoryService.removeFromHistory(parseInt(user.id), id);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to remove from history:', error);
      alert('Không thể xóa khỏi lịch sử. Vui lòng thử lại.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-white mb-4">Vui lòng đăng nhập</h2>
          <p className="text-white/70 mb-6">Bạn cần đăng nhập để xem danh sách của mình.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 rounded-3xl">
      <div className="w-full px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Danh sách của tôi</h1>
          <p className="text-white/70">Quản lý phim yêu thích, lịch sử xem và danh sách tùy chỉnh</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Phim yêu thích"
            stats={getListStats(favorites)}
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            }
            color="from-red-500 to-pink-600"
          />
          <StatsCard
            title="Lịch sử xem"
            stats={getListStats(history)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            color="from-blue-500 to-cyan-600"
          />
          <StatsCard
            title="Danh sách tùy chỉnh"
            stats={getCustomListsStats(customLists)}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            color="from-purple-500 to-indigo-600"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-2xl p-2 mb-6">
          {[
            { id: 'favorites' as ListType, label: 'Yêu thích', count: favorites.length },
            { id: 'history' as ListType, label: 'Đã xem', count: history.length },
            { id: 'custom' as ListType, label: 'Danh sách', count: customLists.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.id 
                    ? 'bg-white/30 text-white' 
                    : 'bg-white/20 text-white/80'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Content */}
        <div className="mt-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="bg-white/10 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (activeTab === 'custom' ? filteredCustomLists.length === 0 : filteredData.length === 0) ? (
            <EmptyState 
              type={activeTab} 
              onAction={() => activeTab === 'custom' ? navigate('/account/lists') : navigate('/')}
            />
          ) : (
            <>
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-white/70">
                  {activeTab === 'custom' 
                    ? `Hiển thị ${filteredCustomLists.length} / ${customLists.length} danh sách`
                    : `Hiển thị ${filteredData.length} / ${currentData.length} phim`
                  }
                </div>
              </div>

              {/* List view only */}
              {activeTab === 'custom' ? (
                // Custom lists view
                <div className="space-y-4">
                  {filteredCustomLists.map((list: CustomList) => (
                    <div key={list.id} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 ring-1 ring-white/10 hover:ring-white/20 transition-all duration-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-white mb-2">{list.name}</h3>
                          {list.description && (
                            <p className="text-white/70 text-sm mb-3">{list.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            list.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {list.isPublic ? 'Công khai' : 'Riêng tư'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-white/70 mb-4">
                        <span>{list.itemCount} phim</span>
                        <span>Cập nhật: {formatDate(list.updatedAt)}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/account/lists`)}
                          className="flex-1 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl hover:bg-blue-500/30 transition-colors text-sm font-medium"
                        >
                          Xem danh sách
                        </button>
                        <button
                          onClick={() => navigate(`/account/lists`)}
                          className="bg-white/10 text-white/70 px-4 py-2 rounded-xl hover:bg-white/20 transition-colors text-sm"
                        >
                          Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredData.map((item) => (
                    <div key={`${item.id}-${activeTab}`} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 ring-1 ring-white/10">
                      <div className="flex items-center gap-6">
                        {(() => {
                          const common = getCommonItem(item);
                          return (
                            <>
                              <div className="w-20 h-28 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={getImageUrl(common.poster_url || common.poster || '')}
                                  alt={common.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-movie.jpg';
                                  }}
                                />
                              </div>
                              
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-white mb-2">{common.title}</h3>
                                <div className="flex items-center gap-4 text-white/70 text-sm mb-3">
                                  {common.year && <span>{common.year}</span>}
                                  {common.duration && <span>{common.duration} phút</span>}
                                  {common.rating && <span>⭐ {common.rating}</span>}
                                  <span className="px-2 py-1 bg-white/10 rounded-full text-xs">
                                    {common.is_series ? 'Phim bộ' : 'Phim lẻ'}
                                  </span>
                                </div>
                                  <div className="text-white/60 text-sm">
                                    {activeTab === 'favorites' && isFavoriteItem(item) && (item as any).favorited_at && (
                                      <span>Đã thêm: {formatDate((item as any).favorited_at)}</span>
                                    )}
                                    {activeTab === 'history' && isWatchHistoryItem(item) && item.last_watched_at && (
                                      <span>Xem lần cuối: {formatDate(item.last_watched_at)}</span>
                                    )}
                                  </div>
                              </div>
                            </>
                          );
                        })()}
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const common = getCommonItem(item);
                              const isSeries = isFavoriteItem(item) ? (item as any).type === 'series' : 
                                              isWatchHistoryItem(item) ? (item as any).type === 'series' : false;
                              
                              if (isWatchHistoryItem(item)) {
                                // Convert progress percentage to seconds
                                const progressSeconds = item.progress ? Math.round((item.progress / 100) * 1500) : 0;
                                
                                if (isSeries) {
                                  // Use episode from watch history if available
                                  const episodeNumber = item.episode_number;
                                  const watchUrl = episodeNumber 
                                    ? `/watch/series/${common.slug || common.id}?s=1&e=${episodeNumber}&ep=tap-${episodeNumber}&t=${progressSeconds}&provider=local`
                                    : `/watch/series/${common.slug || common.id}?s=1&e=1&ep=tap-1&t=${progressSeconds}&provider=local`;
                                  navigate(watchUrl);
                                } else {
                                  // For movies, include progress time
                                  navigate(`/watch/movie/${common.slug || common.id}?t=${progressSeconds}&provider=local`);
                                }
                              } else {
                                // Default behavior for favorites (no progress tracking)
                                navigate(`/watch/${isSeries ? 'series' : 'movie'}/${common.slug || common.id}?provider=local`);
                              }
                            }}
                            className="bg-green-500/20 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            Xem ngay
                          </button>
                          
                          <button
                            onClick={() => {
                              const common = getCommonItem(item);
                              navigate(`/${isFavoriteItem(item) ? (item as any).type === 'series' ? 'series' : 'movies' : 'movies'}/${common.slug || common.id}?provider=local`);
                            }}
                            className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                          >
                            Chi tiết
                          </button>
                          
                          {activeTab === 'favorites' && isFavoriteItem(item) && (
                            <button
                              onClick={() => handleRemoveFromFavorites(String(item.id), (item as any).type)}
                              className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              Bỏ yêu thích
                            </button>
                          )}
                          
                          {activeTab === 'history' && isWatchHistoryItem(item) && (
                            <button
                              onClick={() => handleRemoveFromHistory(Number(item.id))}
                              className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/30 transition-colors"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
