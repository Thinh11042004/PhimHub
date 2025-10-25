import React, { useMemo, useState } from "react";
import Modal from "@shared/components/Modal";

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
}: {
  open: boolean;
  onClose: () => void;
  initial: Partial<EditMoviePayload>;
  onSubmit: (payload: EditMoviePayload) => void;
}) {
  const GENRES = useMemo(
    () => [
      "Hành động","Khoa học","Viễn tưởng","Kinh dị","Tâm lý","Hài hước",
      "Tội phạm","Chiến tranh","Âm nhạc","Hoạt hình","Gia đình","Phiêu lưu",
      "Thần thoại","Lịch sử","Giật gân","Tình cảm"
    ],
    []
  );

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

  const set = <K extends keyof EditMoviePayload>(k: K, v: EditMoviePayload[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const toggleGenre = (g: string) =>
    set("genres", form.genres.includes(g) ? form.genres.filter(x => x !== g) : [...form.genres, g]);

  const onAddToken = (key: "actors" | "directors") => {
    const raw = prompt(key === "actors" ? "Thêm diễn viên" : "Thêm đạo diễn");
    if (!raw) return;
    set(key, [...form[key], raw.trim()]);
  };

  const rmToken = (key: "actors" | "directors", idx: number) =>
    set(key, form[key].filter((_, i) => i !== idx));

  return (
    <Modal open={open} onClose={onClose} title="Chỉnh sửa phim lẻ" maxWidthClass="max-w-4xl">
      <div className="space-y-4">
        {/* Hàng 1: tiêu đề */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-white/70">Tên phim</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/70">Tên gốc</span>
            <input
              value={form.originalTitle}
              onChange={(e) => set("originalTitle", e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
            />
          </label>
        </div>

        {/* Hàng 2: quốc gia / ngôn ngữ / năm / tuổi / thời lượng */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <label className="space-y-1">
            <span className="text-sm text-white/70">Quốc gia</span>
            <input
              value={form.origin}
              onChange={(e) => set("origin", e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/70">Ngôn ngữ</span>
            <input
              value={form.language}
              onChange={(e) => set("language", e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/70">Năm</span>
            <input
              type="number"
              value={form.releaseYear}
              onChange={(e) => set("releaseYear", Number(e.target.value))}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/70">Giới hạn tuổi</span>
            <input
              value={form.age}
              onChange={(e) => set("age", e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/70">Thời lượng (phút)</span>
            <input
              type="number"
              value={form.duration}
              onChange={(e) => set("duration", Number(e.target.value))}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
            />
          </label>
        </div>

        {/* Hàng 3: poster / banner xem nhanh */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-white/70">Poster (URL)</span>
            <input
              value={form.poster ?? ""}
              onChange={(e) => set("poster", e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
            />
            {form.poster && (
              <img src={form.poster} className="mt-2 h-40 w-28 rounded-lg object-cover ring-1 ring-white/10" />
            )}
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/70">Banner (URL)</span>
            <input
              value={form.banner ?? ""}
              onChange={(e) => set("banner", e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
            />
            {form.banner && (
              <img src={form.banner} className="mt-2 h-40 w-full rounded-lg object-cover ring-1 ring-white/10" />
            )}
          </label>
        </div>

        {/* Diễn viên / Đạo diễn */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="mb-1 text-sm text-white/70">Diễn viên</div>
            <div className="flex flex-wrap gap-2">
              {form.actors.map((a, i) => (
                <span key={i} className="rounded-full bg-white/10 px-2 py-1 text-sm">
                  {a}{" "}
                  <button className="ml-1 text-white/60 hover:text-white" onClick={() => rmToken("actors", i)}>
                    ×
                  </button>
                </span>
              ))}
              <button className="rounded-lg bg-white/10 px-2 py-1 text-sm hover:bg-white/15" onClick={() => onAddToken("actors")}>
                + Thêm
              </button>
            </div>
          </div>
          <div>
            <div className="mb-1 text-sm text-white/70">Đạo diễn</div>
            <div className="flex flex-wrap gap-2">
              {form.directors.map((d, i) => (
                <span key={i} className="rounded-full bg-white/10 px-2 py-1 text-sm">
                  {d}{" "}
                  <button className="ml-1 text-white/60 hover:text-white" onClick={() => rmToken("directors", i)}>
                    ×
                  </button>
                </span>
              ))}
              <button className="rounded-lg bg-white/10 px-2 py-1 text-sm hover:bg-white/15" onClick={() => onAddToken("directors")}>
                + Thêm
              </button>
            </div>
          </div>
        </div>

        {/* Thể loại */}
        <div>
          <div className="mb-1 text-sm text-white/70">Thể loại</div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => {
              const active = form.genres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`rounded-full border px-3 py-1 text-sm ${
                    active ? "border-cyan-300 bg-cyan-500/20" : "border-white/20 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mô tả */}
        <label className="block space-y-1">
          <span className="text-sm text-white/70">Mô tả chi tiết</span>
          <textarea
            rows={4}
            value={form.overview}
            onChange={(e) => set("overview", e.target.value)}
            className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/15">
            Đóng
          </button>
          <button
            onClick={() => onSubmit(form)}
            className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-900 hover:bg-cyan-400"
          >
            Xác nhận thay đổi
          </button>
        </div>
      </div>
    </Modal>
  );
}
