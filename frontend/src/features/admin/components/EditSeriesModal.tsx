import React, { useMemo, useState } from "react";
import Modal from "@shared/components/Modal";
import { SelectionModal } from './SelectionModal';
import { useSeriesGenres } from '../hooks/useMovieGenres';
import { GenrePillsSection } from './GenrePills';

/** ==== Kiểu dữ liệu mock ==== */
type SeriesEditData = {
  title: string;
  originalTitle: string;
  actors: string[];
  directors: string[];
  origin: string;           // Quốc gia
  language: string;         // Ngôn ngữ gốc
  totalSeasons: number;
  episodesPerSeason: number;
  releaseYear: number;
  age: string;
  genres: string[];         // thể loại đã chọn
  overview: string;
  poster: string;
  banner: string;
};

// Genres will be fetched from API

/** Chip */
function Chip({
  label, active, onToggle,
}: { label: string; active: boolean; onToggle?: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`mb-2 mr-2 rounded-full border px-3 py-1 text-sm ${
        active ? "border-cyan-400 bg-cyan-400/10" : "border-white/20 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  initial: SeriesEditData;
  onSubmit?: (payload: SeriesEditData) => Promise<void>; // gọi API lưu thật nếu muốn
};

export default function EditSeriesModal({ open, onClose, initial, onSubmit, seriesId }: Props & { seriesId?: number }) {
  const [form, setForm] = useState<SeriesEditData>(initial);
  // Use new genres hook for series
  const { 
    all: allGenres, 
    selectedIds, 
    toggleGenre, 
    saveGenres,
    loading: genresLoading, 
    error: genresError 
  } = useSeriesGenres(seriesId || null);

  const [savingGenres, setSavingGenres] = useState(false);

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (open) {
      setForm(initial);
    }
  }, [open, initial]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showActorSelection, setShowActorSelection] = useState(false);
  const [showDirectorSelection, setShowDirectorSelection] = useState(false);

  const years = useMemo(() => {
    const y: number[] = [];
    const now = new Date().getFullYear();
    for (let i = now; i >= 1960; i--) y.push(i);
    return y;
  }, []);

  const setField = <K extends keyof SeriesEditData>(key: K, value: SeriesEditData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSaveGenres = async () => {
    try {
      setSavingGenres(true);
      const result = await saveGenres();
      if (result.success) {
        console.log('Series genres saved successfully');
      } else {
        console.error('Failed to save series genres:', result.message);
      }
    } catch (error) {
      console.error('Error saving series genres:', error);
    } finally {
      setSavingGenres(false);
    }
  };

  const handlePickFile = (kind: "poster" | "banner", file?: File | null) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setField(kind, url as any);
  };

  const addActor = (name: string) => {
    if (!name.trim()) return;
    setField("actors", [...form.actors, name.trim()]);
  };
  const addDirector = (name: string) => {
    if (!name.trim()) return;
    setField("directors", [...form.directors, name.trim()]);
  };

  const removeFrom = (key: "actors" | "directors", idx: number) =>
    setField(key, form[key].filter((_, i) => i !== idx) as any);

  const submit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onSubmit?.(form);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật phim bộ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActorSelect = (actor: { id: number; name: string }) => {
    if (!form.actors.includes(actor.name)) {
      setField('actors', [...form.actors, actor.name]);
    }
  };

  const handleDirectorSelect = (director: { id: number; name: string }) => {
    if (!form.directors.includes(director.name)) {
      setField('directors', [...form.directors, director.name]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa phim bộ" maxWidthClass="max-w-5xl">
      <div className="space-y-6">
        {/* Hàng 1: tên / tên gốc */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Tên phim bộ
            </span>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-blue-400 transition-all duration-200 shadow-lg"
              placeholder="Nhập tên phim bộ..."
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tên phim bản gốc
            </span>
            <input
              value={form.originalTitle}
              onChange={(e) => setField("originalTitle", e.target.value)}
              className="w-full rounded-xl bg-white/95 px-4 py-3 text-slate-800 outline-none border-2 border-transparent focus:border-green-400 transition-all duration-200 shadow-lg"
              placeholder="Nhập tên gốc..."
            />
          </label>
        </div>

        {/* Hàng 2: chọn diễn viên / đạo diễn */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-white/70">Diễn viên đã chọn</span>
            <div className="flex flex-wrap gap-2 rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
              {form.actors.map((a, i) => (
                <span key={`${a}-${i}`} className="rounded-full bg-white/10 px-2 py-0.5 text-sm">
                  {a}{" "}
                  <button
                    className="ml-1 text-white/60 hover:text-white"
                    onClick={() => removeFrom("actors", i)}
                    type="button"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <button 
                className="rounded-full bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all duration-200 flex items-center gap-1" 
                onClick={() => setShowActorSelection(true)}
              >
                <span>+</span> Thêm diễn viên
              </button>
            </div>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-white/70">Đạo diễn đã chọn</span>
            <div className="flex flex-wrap gap-2 rounded-lg bg-white/5 p-2 ring-1 ring-white/10">
              {form.directors.map((d, i) => (
                <span key={`${d}-${i}`} className="rounded-full bg-white/10 px-2 py-0.5 text-sm">
                  {d}{" "}
                  <button
                    className="ml-1 text-white/60 hover:text-white"
                    onClick={() => removeFrom("directors", i)}
                    type="button"
                  >
                    ✕
                  </button>
                </span>
              ))}
              <button 
                className="rounded-full bg-amber-500/20 px-3 py-2 text-sm text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 transition-all duration-200 flex items-center gap-1" 
                onClick={() => setShowDirectorSelection(true)}
              >
                <span>+</span> Thêm đạo diễn
              </button>
            </div>
          </label>
        </div>

        {/* Hàng 3: meta ngắn */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <SelectBlock label="Đạo diễn (quốc gia)" value={form.origin} onChange={(v) => setField("origin", v)}
            options={["Việt Nam","Mỹ","Nhật","Hàn","Pháp","Anh","Canada","TBN","Đức"]}/>
          <SelectBlock label="Ngôn ngữ gốc" value={form.language} onChange={(v) => setField("language", v)}
            options={["vi","en","jp","kr","fr","de","es"]}/>
          <SelectBlock label="Số lượng phần (season)" value={String(form.totalSeasons)} onChange={(v) => setField("totalSeasons", Number(v))}
            options={Array.from({length:15},(_,i)=>String(i+1))}/>
          <SelectBlock label="Số lượng tập / phần" value={String(form.episodesPerSeason)} onChange={(v) => setField("episodesPerSeason", Number(v))}
            options={Array.from({length:40},(_,i)=>String(i+1))}/>
          <SelectBlock label="Năm sản xuất" value={String(form.releaseYear)} onChange={(v)=>setField("releaseYear", Number(v))}
            options={years.map(String)}/>
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
        <label className="block space-y-1">
          <span className="text-sm text-white/70">Nhập mô tả chi tiết</span>
          <textarea
            rows={5}
            value={form.overview}
            onChange={(e) => setField("overview", e.target.value)}
            className="w-full rounded-xl bg-white/90 px-3 py-2 text-slate-800 outline-none"
            placeholder="Mô tả…"
          />
        </label>

        {/* Ảnh: poster + ảnh nền */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <span className="text-sm font-medium text-white/90 flex items-center gap-2">
              <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Poster phim
            </span>
            
            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-xs text-white/70">URL Poster</label>
              <input
                value={form.poster ?? ""}
                onChange={(e) => setField("poster", e.target.value)}
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
                  onChange={(e) => handlePickFile("poster", e.target.files?.[0])}
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
                  onClick={() => setField("poster", "")}
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
              Ảnh nền phim
            </span>
            
            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-xs text-white/70">URL Banner</label>
              <input
                value={form.banner ?? ""}
                onChange={(e) => setField("banner", e.target.value)}
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
                  onChange={(e) => handlePickFile("banner", e.target.files?.[0])}
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
                  onClick={() => setField("banner", "")}
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

        {/* Cột phải mini-controls (giống mock) */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,260px]">
          {/* fake list tập – demo */}
          <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
            <div className="mb-2 text-sm text-white/70">Danh sách tập (mock)</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="group relative overflow-hidden rounded-lg bg-white/10">
                  <img
                    src={`https://picsum.photos/seed/ep-${i}/480/270`}
                    className="aspect-video w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-xs opacity-0 group-hover:opacity-100"
                  >
                    ▶ Xem thử
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <MiniButton label="➕ Thêm tập" />
            <MiniButton label="⬆️ Đổ tập" />
            <MiniButton label="🧩 Đổ story/ảnh bìa" />
            <MiniButton label="⬆️ Tải lẻ phần nhỏ" />
            <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <InputMini label="Nhập phần" placeholder="VD: 1" />
              <InputMini label="Nhập tập" placeholder="VD: 10" />
              <InputMini label="Nhập/đổi phần bìa" placeholder="URL ảnh" />
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <button
            type="button"
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
            type="button"
            onClick={submit}
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

/** ==== Các sub components nhỏ dùng lại ==== */
function SelectBlock({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="space-y-1">
      <span className="text-sm text-white/70">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function ImageCard({
  label, src, onPick,
}: { label: string; src?: string; onPick: (f?: File | null) => void }) {
  return (
    <div className="space-y-3">
      <span className="text-sm font-medium text-white/90 flex items-center gap-2">
        <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {label}
      </span>
      
      {/* File Upload */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPick(e.target.files?.[0])}
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
      <div className="relative overflow-hidden rounded-xl border-2 border-white/20 shadow-xl">
        <img
          src={src || "https://picsum.photos/seed/placeholder/1000/600"}
          className="h-48 w-full object-cover transition-transform duration-300 hover:scale-105"
          alt={`${label} preview`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        {src && (
          <button
            onClick={() => onPick(null)}
            className="absolute top-2 right-2 p-1 bg-red-500/80 text-white rounded-full hover:bg-red-500 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function MiniButton({ label }: { label: string }) {
  return (
    <button type="button" className="w-full rounded-lg bg-white/10 px-3 py-2 text-left text-sm hover:bg-white/15">
      {label}
    </button>
  );
}
function InputMini({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <label className="mb-2 block text-sm">
      <span className="mb-1 block text-white/70">{label}</span>
      <input
        className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
        placeholder={placeholder}
      />
    </label>
  );
}

function AddInline({ onAdd, placeholder }: { onAdd: (v: string) => void; placeholder?: string }) {
  const [val, setVal] = useState("");
  return (
    <div className="flex items-center rounded-full bg-white/10 pl-2 pr-1">
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent px-2 py-1 text-sm outline-none"
      />
      <button
        type="button"
        className="rounded-full bg-cyan-500 px-2 py-1 text-xs font-medium text-slate-900 hover:bg-cyan-400"
        onClick={() => {
          onAdd(val);
          setVal("");
        }}
      >
        Thêm
      </button>
    </div>
  );
}
