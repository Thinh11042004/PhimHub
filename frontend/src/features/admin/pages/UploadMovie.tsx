import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";

/* =========================
   Mock dữ liệu chọn nhanh
========================= */
const ALL_GENRES = [
  "Hành động","Khoa học","Viễn tưởng","Kinh dị","Tâm lý","Hài hước","Tội phạm",
  "Phiêu lưu","Lãng mạn","Gia đình","Hoạt hình","Chiến tranh","Âm nhạc",
];
const COUNTRIES = ["Mỹ","Anh","Nhật","Hàn","Việt Nam","Pháp","Ý","Tây Ban Nha","Úc","Canada"];
const AGE_RATINGS = ["P","K","T13","T16","T18","R"];
const YEARS = Array.from({ length: 60 }, (_, i) => 2025 - i);

/* =========================
   Schema validate
========================= */
const MovieSchema = z.object({
  title: z.string().min(2, "Nhập tên phim"),
  originalTitle: z.string().optional(),
  year: z.number().min(1900).max(2100),
  duration: z.number().min(1).max(600),
  country: z.string().min(1, "Chọn quốc gia"),
  age: z.string().min(1, "Chọn độ tuổi"),
  genres: z.array(z.string()).min(1, "Chọn thể loại"),
  actors: z.array(z.string()).max(30),
  directors: z.array(z.string()).max(10),
  description: z.string().min(10, "Mô tả tối thiểu 10 ký tự"),
  trailer: z.string().url("Trailer phải là URL hợp lệ").optional().or(z.literal("")),
  posterFile: z.instanceof(File).optional(),
  videoFile: z.instanceof(File).optional(),
});
type MovieForm = z.infer<typeof MovieSchema>;

/* =========================
   Chip & Tag input
========================= */
function Chip({ active, onToggle, children }: { active: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`rounded-full px-3 py-1 text-sm ring-1 ${
        active ? "bg-cyan-500 text-black ring-transparent" : "bg-white/5 ring-white/15 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function TagInput({
  value, onChange, placeholder,
}: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  const add = (s: string) => {
    const v = s.trim();
    if (!v) return;
    if (value.includes(v)) return;
    onChange([...value, v]);
    setText("");
  };
  return (
    <div className="rounded-2xl bg-white/5 p-2 ring-1 ring-white/10">
      <div className="flex flex-wrap gap-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-sm">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="text-white/70">×</button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(text);
            }
            if (e.key === "Backspace" && !text && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={placeholder ?? "Nhập và Enter để thêm"}
          className="min-w-[160px] flex-1 bg-transparent px-2 py-1 outline-none placeholder:text-white/50"
        />
      </div>
    </div>
  );
}

/* =========================
   Upload helpers (mock)
========================= */
function useUpload() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // mock upload – thay bằng POST /admin/upload (presign + PUT S3/Cloud)
  const start = async (file: File) => {
    setUploading(true);
    setProgress(0);
    // fake progress
    await new Promise<void>((res) => {
      const total = 160;
      let t = 0;
      const i = setInterval(() => {
        t += 1;
        setProgress(Math.min(100, Math.round((t / total) * 100)));
        if (t >= total) {
          clearInterval(i);
          res();
        }
      }, 30);
    });
    setUploading(false);
    // trả về URL giả lập
    return URL.createObjectURL(file);
  };

  const reset = () => setProgress(0);
  return { uploading, progress, start, reset };
}

/* =========================
   Main page
========================= */
export default function UploadMovie() {
  const {
    register, handleSubmit, watch, setValue, formState: { errors, isSubmitting },
  } = useForm<MovieForm>({
    resolver: zodResolver(MovieSchema),
    defaultValues: {
      title: "",
      originalTitle: "",
      year: YEARS[0],
      duration: 120,
      country: COUNTRIES[0],
      age: AGE_RATINGS[0],
      genres: [],
      actors: [],
      directors: [],
      description: "",
      trailer: "",
    },
  });

  // poster & video preview
  const posterFile = watch("posterFile");
  const videoFile = watch("videoFile");
  const posterURL = useMemo(() => (posterFile ? URL.createObjectURL(posterFile) : ""), [posterFile]);
  const videoURL = useMemo(() => (videoFile ? URL.createObjectURL(videoFile) : ""), [videoFile]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const upPoster = useUpload();
  const upVideo = useUpload();

  const onSubmit = async (data: MovieForm) => {
    // 1) upload file (nếu có) để lấy URL
    let poster_url = "";
    let source_url = "";
    if (data.posterFile) poster_url = await upPoster.start(data.posterFile);
    if (data.videoFile) source_url = await upVideo.start(data.videoFile);

    // 2) gọi API tạo phim
    // POST /admin/movies {title, original_title, release_year, duration, country, age_rating, genres[], actors[], directors[], description, trailer_url, thumbnail_url, source_url}
    // Demo: log ra
    console.log("Create movie payload", {
      ...data,
      posterFile: undefined,
      videoFile: undefined,
      poster_url,
      source_url,
    });
    alert("Đã mô phỏng upload thành công. Xem console để thấy payload 👀");
  };

  const toggleGenre = (g: string) => {
    const cur = new Set(watch("genres"));
    cur.has(g) ? cur.delete(g) : cur.add(g);
    setValue("genres", Array.from(cur));
  };

  useEffect(() => {
    return () => {
      if (posterURL) URL.revokeObjectURL(posterURL);
      if (videoURL) URL.revokeObjectURL(videoURL);
    };
  }, [posterURL, videoURL]);

  return (
    <div className="w-full px-3 py-4 md:px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Tải phim lẻ</h1>
          <p className="text-sm text-white/70">Tạo phim mới với thông tin chi tiết</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/15">
            Tài khoản Admin
          </Link>
          <Link to="/admin/movies" className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/15">
            Quản lý phim lẻ
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,280px] xl:grid-cols-[1fr,320px]">
        {/* LEFT: FORM */}
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Tên phim *</label>
              <input 
                {...register("title")} 
                className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400" 
                placeholder="Nhập tên phim"
              />
              {errors.title && <p className="text-sm text-red-400">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Tên phim bản gốc</label>
              <input 
                {...register("originalTitle")} 
                className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400" 
                placeholder="Original title"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Năm sản xuất *</label>
              <select {...register("year", { valueAsNumber: true })} className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400">
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Thời lượng (phút) *</label>
              <input 
                type="number" 
                min={1} 
                {...register("duration", { valueAsNumber: true })} 
                className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="120"
              />
              {errors.duration && <p className="text-sm text-red-400">{errors.duration.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Quốc gia *</label>
              <select {...register("country")} className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400">
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Độ tuổi *</label>
              <select {...register("age")} className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400">
                {AGE_RATINGS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-white/80">Thể loại *</label>
            <div className="flex flex-wrap gap-2">
              {ALL_GENRES.map((g) => (
                <Chip key={g} active={watch("genres").includes(g)} onToggle={() => toggleGenre(g)}>
                  {g}
                </Chip>
              ))}
            </div>
            {errors.genres && <p className="text-sm text-red-400">{errors.genres.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Diễn viên</label>
              <TagInput value={watch("actors")} onChange={(v) => setValue("actors", v)} placeholder="Nhập tên diễn viên, Enter để thêm" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Đạo diễn</label>
              <TagInput value={watch("directors")} onChange={(v) => setValue("directors", v)} placeholder="Nhập tên đạo diễn, Enter để thêm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Mô tả chi tiết *</label>
            <textarea
              rows={6}
              {...register("description")}
              className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Nhập mô tả nội dung, tóm tắt cốt truyện, lời giới thiệu…"
            />
            {errors.description && <p className="text-sm text-red-400">{errors.description.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Trailer (URL YouTube/Vimeo)</label>
            <input 
              {...register("trailer")} 
              className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400" 
              placeholder="https://youtube.com/watch?v=..."
            />
            {errors.trailer && <p className="text-sm text-red-400">{errors.trailer.message}</p>}
            <p className="text-xs text-white/60">* Không bắt buộc</p>
          </div>
        </div>

        {/* RIGHT: UPLOAD + actions */}
        <aside className="space-y-4">
          {/* Poster */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-medium text-white">Poster phim</div>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center hover:border-cyan-400 hover:bg-white/10 transition-colors">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setValue("posterFile", f, { shouldValidate: false });
                }}
              />
              <div className="text-white/70">
                <div className="mb-2 text-2xl">📸</div>
                <div className="text-sm">Chọn ảnh poster</div>
                <div className="text-xs text-white/50">JPG, PNG (tối đa 5MB)</div>
              </div>
            </label>
            {posterURL && (
              <div className="mt-3">
                <img src={posterURL} alt="poster" className="aspect-[2/3] w-full rounded-lg object-cover" />
              </div>
            )}
            {upPoster.uploading && (
              <div className="mt-3">
                <div className="mb-1 text-xs text-white/70">Đang tải lên...</div>
                <div className="h-2 w-full rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-400 transition-all duration-300" style={{ width: `${upPoster.progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Nguồn phim */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-3 text-sm font-medium text-white">Nguồn phim</div>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center hover:border-cyan-400 hover:bg-white/10 transition-colors">
              <input
                type="file"
                accept="video/mp4,application/x-mpegURL,.m3u8"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setValue("videoFile", f, { shouldValidate: false });
                }}
              />
              <div className="text-white/70">
                <div className="mb-2 text-2xl">🎬</div>
                <div className="text-sm">Chọn file video</div>
                <div className="text-xs text-white/50">MP4, M3U8 (tối đa 2GB)</div>
              </div>
            </label>

            {videoURL && (
              <div className="mt-3">
                <video ref={videoRef} className="w-full rounded-lg" controls poster={posterURL || undefined}>
                  <source src={videoURL} />
                </video>
              </div>
            )}

            {upVideo.uploading && (
              <div className="mt-3">
                <div className="mb-1 text-xs text-white/70">Đang tải lên...</div>
                <div className="h-2 w-full rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-cyan-400 transition-all duration-300" style={{ width: `${upVideo.progress}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSubmitting || upPoster.uploading || upVideo.uploading}
              className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-semibold text-slate-900 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {isSubmitting || upPoster.uploading || upVideo.uploading ? "Đang xử lý…" : "Xác nhận upload"}
            </button>
            <div className="rounded-lg bg-white/5 p-3 text-xs text-white/60">
              <div className="mb-1 font-medium">💡 Lưu ý:</div>
              <div>Sau khi tạo phim, bạn có thể vào <Link to="/admin/movies" className="text-cyan-400 underline">Quản lý phim lẻ</Link> để chỉnh sửa thêm (thể loại phụ, phụ đề, SEO, ẩn/hiện…).</div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
