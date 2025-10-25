import React, { useMemo, useState } from "react";
import Modal from "@shared/components/Modal";

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

const ALL_GENRES = [
  "Anime","Bí ẩn","Chiến tranh","Chiếu rạp","Chuyển thể","Chính kịch","Chính luận","Chính Trị","Cách mạng",
  "Cổ trang","Cổ tích","Cổ điển","DC Comic","Disney","Đời thường","Gay cấn","Gia đình","Giá tưởng",
  "Hoạt hình","Hài hước","Hành động","Hôn nhân","Học đường","Khoa học","Khoa học","Kinh dị","Kinh điển","Khoa học viễn tưởng",
  "Lãng mạn","Lịch sử","Live Action","Lãng mạn","Lịch sử","Marvel Comic","Người mẫu","Nhạc kịch","Phiêu lưu",
  "Phép thuật","Siêu anh hùng","Thiếu nhi","Thần thoại","Thể thao","Tài liệu","Tâm lý","Tình cảm","Võ thuật","Viễn tưởng","Xuyên không",
];

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
  onSubmit?: (payload: SeriesEditData) => void; // gọi API lưu thật nếu muốn
};

export default function EditSeriesModal({ open, onClose, initial, onSubmit }: Props) {
  const [form, setForm] = useState<SeriesEditData>(initial);

  const years = useMemo(() => {
    const y: number[] = [];
    const now = new Date().getFullYear();
    for (let i = now; i >= 1960; i--) y.push(i);
    return y;
  }, []);

  const setField = <K extends keyof SeriesEditData>(key: K, value: SeriesEditData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleGenre = (g: string) =>
    setForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }));

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

  const submit = () => {
    onSubmit?.(form);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Tải Phim bộ" maxWidthClass="max-w-4xl">
      <div className="space-y-3">
        {/* Hàng 1: tên / tên gốc */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-white/70">Tên phim</span>
            <input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
              placeholder="Thay đổi tên phim"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/70">Tên phim bản gốc</span>
            <input
              value={form.originalTitle}
              onChange={(e) => setField("originalTitle", e.target.value)}
              className="w-full rounded-lg bg-white/90 px-3 py-2 text-slate-800 outline-none"
              placeholder="The wonderfully weird world of Gumball"
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
              <AddInline onAdd={addActor} placeholder="Thêm diễn viên" />
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
              <AddInline onAdd={addDirector} placeholder="Thêm đạo diễn" />
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

        {/* Hàng 4: thể loại (chips) */}
        <div className="">
          <span className="mb-2 block text-sm text-white/70">Thể loại</span>
          <div className="rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
            {ALL_GENRES.map((g) => (
              <Chip key={g} label={g} active={form.genres.includes(g)} onToggle={() => toggleGenre(g)} />
            ))}
          </div>
        </div>

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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ImageCard
            label="Poster phim"
            src={form.poster}
            onPick={(f) => handlePickFile("poster", f)}
          />
          <ImageCard
            label="Ảnh nền phim"
            src={form.banner}
            onPick={(f) => handlePickFile("banner", f)}
          />
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

        {/* Footer */}
        <div className="mt-2 flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 px-5 py-2 hover:bg-white/15"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={submit}
            className="rounded-lg bg-cyan-500 px-5 py-2 font-medium text-slate-900 hover:bg-cyan-400"
          >
            👍 Xác nhận thay đổi
          </button>
        </div>
      </div>
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
    <div className="rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm text-white/70">{label}</div>
        <label className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">
          Tải {label.toLowerCase()}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </label>
      </div>
      <div className="overflow-hidden rounded-lg ring-1 ring-white/10">
        <img
          src={src || "https://picsum.photos/seed/placeholder/1000/600"}
          className="aspect-video w-full object-cover"
        />
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
