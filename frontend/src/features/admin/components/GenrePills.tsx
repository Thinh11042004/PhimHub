import React, { useMemo } from 'react';
import { Genre } from '../hooks/useMovieGenres';

interface GenrePillsProps {
  all: Genre[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export default function GenrePills({
  all,
  selectedIds,
  onToggle,
  loading = false,
  error = null,
  disabled = false
}: GenrePillsProps) {
  const selected = useMemo(() => new Set(selectedIds.map(Number)), [selectedIds]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/60">
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <span>Đang tải thể loại...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-sm">
        Lỗi tải thể loại: {error}
      </div>
    );
  }

  if (all.length === 0) {
    return (
      <div className="text-white/60 text-sm">
        Không có thể loại nào
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {all.map(genre => {
        const active = selected.has(Number(genre.id));
        return (
          <button
            key={genre.id}
            type="button"
            onClick={() => !disabled && onToggle(Number(genre.id))}
            disabled={disabled}
            aria-pressed={active}
            className={[
              'px-3 py-1.5 rounded-full border-2 text-sm font-medium transition-all duration-200',
              'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-400/50',
              active
                ? 'bg-violet-500/90 text-white border-violet-400 shadow-lg shadow-violet-500/20'
                : 'bg-slate-700/60 text-slate-200 border-slate-600 hover:bg-slate-600 hover:border-slate-500',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ].join(' ')}
          >
            {genre.name}
          </button>
        );
      })}
    </div>
  );
}

// Component cho việc hiển thị genres trong edit modal
export function GenrePillsSection({
  all,
  selectedIds,
  onToggle,
  loading = false,
  error = null,
  disabled = false,
  onSave,
  saving = false
}: GenrePillsProps & {
  onSave?: () => void;
  saving?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-white/90 flex items-center gap-2">
        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Thể loại
      </div>
      
      <GenrePills
        all={all}
        selectedIds={selectedIds}
        onToggle={onToggle}
        loading={loading}
        error={error}
        disabled={disabled}
      />
      
      {onSave && (
        <div className="flex justify-end">
          <button
            onClick={onSave}
            disabled={saving || disabled}
            className={[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              'flex items-center gap-2',
              saving || disabled
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : 'bg-violet-500 hover:bg-violet-600 text-white hover:shadow-lg hover:shadow-violet-500/25'
            ].join(' ')}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang lưu...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Lưu thể loại
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
