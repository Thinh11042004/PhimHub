import React, { useMemo, useState } from "react";
import Modal from "@shared/components/Modal";
import { SelectionModal } from './SelectionModal';
import { useMovieGenres } from '../hooks/useMovieGenres';
import { GenrePillsSection } from './GenrePills';

type EditMoviePayload = {
  title: string;
  originalTitle?: string;
  actors: string[];
  directors: string[];
  origin: string;        // quốc gia
  language: string;      // ngôn ngữ
  duration: number;      // phút
  releaseYear: number;
  age: string;
  genres: string[];
  overview: string;
  poster?: string;
  banner?: string;
};

export default function EditMovieModal({
  open,
  onClose,
  initial,
  onSubmit,
  movieId,
}: {
  open: boolean;
  onClose: () => void;
  initial: Partial<EditMoviePayload>;
  onSubmit: (payload: EditMoviePayload) => Promise<void>;
  movieId?: number;
}) {
  // Use new genres hook
  const { 
    all: allGenres, 
    selectedIds, 
    toggleGenre, 
    saveGenres,
    loading: genresLoading, 
    error: genresError 
  } = useMovieGenres(movieId || null);

  const [savingGenres, setSavingGenres] = useState(false);

  const [form, setForm] = useState<EditMoviePayload>({
    title: initial.title ?? "",
    originalTitle: initial.originalTitle ?? "",
    actors: initial.actors ?? [],
    directors: initial.directors ?? [],
    origin: initial.origin ?? "Mỹ",
    language: initial.language ?? "en",
    duration: Number(initial.duration ?? 120),
    releaseYear: Number(initial.releaseYear ?? 2024),
    age: initial.age ?? "16+",
    genres: initial.genres ?? [],
    overview: initial.overview ?? "",
    poster: initial.poster,
    banner: initial.banner,
  });

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (open) {
      setForm({
        title: initial.title ?? "",
        originalTitle: initial.originalTitle ?? "",
        actors: initial.actors ?? [],
        directors: initial.directors ?? [],
        origin: initial.origin ?? "Mỹ",
        language: initial.language ?? "en",
        duration: Number(initial.duration ?? 120),
        releaseYear: Number(initial.releaseYear ?? 2024),
        age: initial.age ?? "16+",
        genres: initial.genres ?? [],
        overview: initial.overview ?? "",
        poster: initial.poster,
        banner: initial.banner,
      });
    }
  }, [open, initial]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActorSelection, setShowActorSelection] = useState(false);
  const [showDirectorSelection, setShowDirectorSelection] = useState(false);

  const set = <K extends keyof EditMoviePayload>(k: K, v: EditMoviePayload[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const handleSaveGenres = async () => {
    try {
      setSavingGenres(true);
      const result = await saveGenres();
      if (result.success) {
        // Show success message or handle as needed
        console.log('Genres saved successfully');
      } else {
        console.error('Failed to save genres:', result.message);
      }
    } catch (error) {
      console.error('Error saving genres:', error);
    } finally {
      setSavingGenres(false);
    }
  };


  const rmToken = (key: "actors" | "directors", idx: number) =>
    set(key, form[key].filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onSubmit(form);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật phim');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActorSelect = (actor: { id: number; name: string }) => {
    if (!form.actors.includes(actor.name)) {
      set('actors', [...form.actors, actor.name]);
    }
  };

  const handleDirectorSelect = (director: { id: number; name: string }) => {
    if (!form.directors.includes(director.name)) {
      set('directors', [...form.directors, director.name]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa phim lẻ" maxWidthClass="max-w-5xl">
      <div className="space-y-6">
        {/* Hàng 1: tiêu đề */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 8h6m-6 4h6m-6 4h6" />
              </svg>
              Tên phim
            </span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-blue-400 transition-all duration-200 shadow-lg"
              placeholder="Nhập tên phim..."
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tên gốc
            </span>
            <input
              value={form.originalTitle}
              onChange={(e) => set("originalTitle", e.target.value)}
              className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-green-400 transition-all duration-200 shadow-lg"
              placeholder="Nhập tên gốc..."
            />
          </label>
        </div>

        {/* Hàng 2: quốc gia / ngôn ngữ / năm / tuổi / thời lượng */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Quốc gia
            </span>
            <input
              value={form.origin}
              onChange={(e) => set("origin", e.target.value)}
              className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-red-400 transition-all duration-200 shadow-lg"
              placeholder="VD: Mỹ, Việt Nam..."
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Ngôn ngữ
            </span>
            <input
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
              className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-purple-400 transition-all duration-200 shadow-lg"
              placeholder="VD: en, vi..."
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Năm
            </span>
            <input
              type="number"
              value={form.releaseYear}
              onChange={(e) => set("releaseYear", Number(e.target.value))}
              className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-yellow-400 transition-all duration-200 shadow-lg"
              placeholder="2024"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Giới hạn tuổi
            </span>
            <input
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
              className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-orange-400 transition-all duration-200 shadow-lg"
              placeholder="VD: 16+, 18+..."
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Thời lượng (phút)
            </span>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => set("duration", Number(e.target.value))}
              className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-cyan-400 transition-all duration-200 shadow-lg"
              placeholder="120"
            />
          </label>
        </div>

        {/* Hàng 3: poster / banner xem nhanh */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Poster
            </span>
            
            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-xs text-white/70">URL Poster</label>
              <input
                value={form.poster ?? ""}
                onChange={(e) => set("poster", e.target.value)}
                className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-pink-400 transition-all duration-200 shadow-lg"
                placeholder="Nhập URL poster..."
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-xs text-white/70">Hoặc upload file</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      set("poster", url);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center w-full h-12 px-4 py-2 border-2 border-dashed border-pink-400/50 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 transition-all duration-200 cursor-pointer">
                  <svg className="w-5 h-5 text-pink-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-pink-300">Chọn file hoặc kéo thả ảnh</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            {form.poster && (
              <div className="relative overflow-hidden rounded-xl border-2 border-white/20 shadow-xl">
                <img 
                  src={form.poster} 
                  className="h-48 w-full object-cover transition-transform duration-300 hover:scale-105" 
                  alt="Poster preview"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <button
                  onClick={() => set("poster", "")}
                  className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              Banner
            </span>
            
            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-xs text-white/70">URL Banner</label>
              <input
                value={form.banner ?? ""}
                onChange={(e) => set("banner", e.target.value)}
                className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-indigo-400 transition-all duration-200 shadow-lg"
                placeholder="Nhập URL banner..."
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-xs text-white/70">Hoặc upload file</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      set("banner", url);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex items-center justify-center w-full h-12 px-4 py-2 border-2 border-dashed border-indigo-400/50 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 transition-all duration-200 cursor-pointer">
                  <svg className="w-5 h-5 text-indigo-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-sm text-indigo-300">Chọn file hoặc kéo thả ảnh</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            {form.banner && (
              <div className="relative overflow-hidden rounded-xl border-2 border-white/20 shadow-xl">
                <img 
                  src={form.banner} 
                  className="h-48 w-full object-cover transition-transform duration-300 hover:scale-105" 
                  alt="Banner preview"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <button
                  onClick={() => set("banner", "")}
                  className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Diễn viên / Đạo diễn */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Diễn viên
            </div>
            <div className="flex flex-wrap gap-2">
              {form.actors.map((a, i) => (
                <span key={i} className="group flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-200">
                  <span>{a}</span>
                  <button 
                    className="ml-1 text-emerald-300 hover:text-red-400 transition-colors duration-200" 
                    onClick={() => rmToken("actors", i)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button 
                className="rounded-full bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-200 flex items-center gap-1" 
                onClick={() => {
                  setShowActorSelection(true);
                }}
              >
                <span>+</span> Thêm
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Đạo diễn
            </div>
            <div className="flex flex-wrap gap-2">
              {form.directors.map((d, i) => (
                <span key={i} className="group flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-2 text-sm text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition-all duration-200">
                  <span>{d}</span>
                  <button 
                    className="ml-1 text-amber-300 hover:text-red-400 transition-colors duration-200" 
                    onClick={() => rmToken("directors", i)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button 
                className="rounded-full bg-amber-500/20 px-3 py-2 text-sm text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition-all duration-200 flex items-center gap-1" 
                onClick={() => {
                  setShowDirectorSelection(true);
                }}
              >
                <span>+</span> Thêm
              </button>
            </div>
          </div>
        </div>

        {/* Thể loại - Sử dụng component mới */}
        <GenrePillsSection
          all={allGenres}
          selectedIds={selectedIds}
          onToggle={toggleGenre}
          loading={genresLoading}
          error={genresError}
          onSave={handleSaveGenres}
          saving={savingGenres}
        />

        {/* Mô tả */}
        <label className="block space-y-3">
          <span className="text-sm font-medium text-white/90 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Mô tả chi tiết
          </span>
          <textarea
            rows={4}
            value={form.overview}
            onChange={(e) => set("overview", e.target.value)}
            className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-teal-400 transition-all duration-200 shadow-lg resize-none"
            placeholder="Nhập mô tả chi tiết về phim..."
          />
        </label>

        {/* Error display */}
        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
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
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-3 font-medium text-white hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang cập nhật...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Xác nhận thay đổi
              </>
            )}
          </button>
        </div>
      </div>

      {/* Selection Modals */}
      <SelectionModal
        open={showActorSelection}
        onClose={() => setShowActorSelection(false)}
        onSelect={handleActorSelect}
        type="actor"
        title="Chọn diễn viên"
        selectedIds={form.actors.map((_, index) => index + 1)} // Use actor indices as IDs
      />
      
      <SelectionModal
        open={showDirectorSelection}
        onClose={() => setShowDirectorSelection(false)}
        onSelect={handleDirectorSelect}
        type="director"
        title="Chọn đạo diễn"
        selectedIds={form.directors.map((_, index) => index + 1)} // Use director indices as IDs
      />
    </Modal>
  );
}
