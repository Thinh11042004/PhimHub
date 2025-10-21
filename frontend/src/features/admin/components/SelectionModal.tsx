import React, { useState, useMemo, useRef, useEffect } from 'react';
import Modal from '../../../shared/components/Modal';
import { usePeopleSearchInfinite } from '../../../hooks/usePeopleSearchInfinite';

interface Person {
  id: number;
  name: string;
  dob?: string;
  nationality?: string;
  photo_url?: string;
  avatar?: string | null;
}

interface SelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (person: Person) => void;
  type: 'actor' | 'director';
  title: string;
  selectedIds: number[];
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
  open,
  onClose,
  onSelect,
  type,
  title,
  selectedIds
}) => {
  const [search, setSearch] = useState('');
  const { 
    items: data, 
    total, 
    loading, 
    loadingMore,
    error, 
    hasMore, 
    loadMore,
    currentPage,
    totalPages
  } = usePeopleSearchInfinite({ 
    open, 
    role: type, 
    query: search, 
    pageSize: 50 
  });
  
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);
  
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  const handleSelect = (person: Person) => {
    onSelect(person);
    onClose();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };


  return (
    <Modal open={open} onClose={onClose} title={title} maxWidthClass="max-w-4xl">
      <div className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/90 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m0 0a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Tìm kiếm {type === 'actor' ? 'diễn viên' : 'đạo diễn'}
          </label>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-blue-400 transition-all duration-200 shadow-lg"
            placeholder={`Nhập tên ${type === 'actor' ? 'diễn viên' : 'đạo diễn'}...`}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-red-200">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            <span className="ml-3 text-white/70">Đang tải...</span>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <div className="space-y-3">
            {data.length === 0 ? (
              <div className="text-center py-8 text-white/70">
                {search ? `Không tìm thấy ${type === 'actor' ? 'diễn viên' : 'đạo diễn'} nào` : `Chưa có ${type === 'actor' ? 'diễn viên' : 'đạo diễn'} nào trong hệ thống`}
              </div>
            ) : (
              <>
                {/* Progress indicator */}
                <div className="text-sm text-white/60 text-center">
                  Đã tải {data.length}/{total} {type === 'actor' ? 'diễn viên' : 'đạo diễn'}
                  {totalPages > 1 && ` (Trang ${currentPage}/${totalPages})`}
                </div>
                
                {/* Items container with proper height */}
                <div className="grid grid-cols-1 gap-3 max-h-[70vh] overflow-y-auto">
                  {data.map((person) => (
                  <div
                    key={person.id}
                    onClick={() => handleSelect(person)}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all duration-200 cursor-pointer"
                  >
                    {/* Avatar */}
                    <img 
                      src={person.avatar || person.photo_url || '/img/person-placeholder.png'} 
                      onError={(e) => {
                        e.currentTarget.src = '/img/person-placeholder.png';
                      }}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      alt={person.name}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white truncate">{person.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-white/60 mt-1">
                        {person.dob && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {new Date(person.dob).getFullYear()}
                          </span>
                        )}
                        {person.nationality && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {person.nationality}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Select Button */}
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span className="ml-2 text-white/60">Đang tải thêm...</span>
                    </div>
                  )}
                  
                  {/* Load more button (fallback) */}
                  {hasMore && !loadingMore && (
                    <div className="text-center py-4">
                      <button
                        onClick={loadMore}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                      >
                        Tải thêm
                      </button>
                    </div>
                  )}
                  
                  {/* End of list indicator */}
                  {!hasMore && data.length > 0 && (
                    <div className="text-center py-4 text-white/50 text-sm">
                      Đã hiển thị tất cả {total} {type === 'actor' ? 'diễn viên' : 'đạo diễn'}
                    </div>
                  )}
                  
                  {/* Sentinel for intersection observer */}
                  <div ref={sentinelRef} className="h-1" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-6 py-3 text-white/80 hover:bg-white/20 hover:text-white transition-all duration-200 border border-white/20 hover:border-white/40"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Đóng
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
