import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useFieldArray, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

/* ========================
   Mock options (replace by API later)
======================== */
const GENRES = [
  "Hành động",
  "Khoa học",
  "Viễn tưởng",
  "Kinh dị",
  "Tâm lý",
  "Hài hước",
  "Tội phạm",
  "Phiêu lưu",
  "Gia đình",
  "Hoạt hình",
  "Âm nhạc",
];
const COUNTRIES = ["Việt Nam", "Mỹ", "Anh", "Nhật", "Hàn", "Pháp", "Tây Ban Nha", "Đức", "Canada"];
const AGE_RATINGS = ["P", "K+", "T13", "T16", "T18", "R"];
const YEARS = Array.from({ length: 70 }, (_, i) => `${new Date().getFullYear() - i}`);

/* ========================
   Schema (validate)
======================== */
const EpisodeSchema = z.object({
  number: z.number().int().min(1, "Số tập ≥ 1"),
  title: z.string().min(1, "Nhập tiêu đề tập"),
  duration: z.number().int().min(1, "Thời lượng ≥ 1"),
  videoUrl: z.string().url("URL video không hợp lệ").optional().or(z.literal("")),
});

const SeasonSchema = z.object({
  seasonNumber: z.number().int().min(1, "Số mùa ≥ 1"),
  title: z.string().optional().default(""),
  episodes: z.array(EpisodeSchema).min(1, "Thêm ít nhất 1 tập"),
});

const SeriesSchema = z.object({
  title: z.string().min(1, "Nhập tên phim"),
  originalTitle: z.string().default(""),
  year: z.string().min(1, "Chọn năm"),
  country: z.string().min(1, "Chọn quốc gia"),
  language: z.string().min(1, "Nhập ngôn ngữ"),
  rating: z.string().min(1, "Chọn phân loại tuổi"),
  genres: z.array(z.string()).min(1, "Chọn ít nhất 1 thể loại"),
  overview: z.string().min(10, "Mô tả ít nhất 10 ký tự"),
  posterFile: z.any().optional(),
  bannerFile: z.any().optional(),
  trailerUrl: z.string().url("URL trailer không hợp lệ").optional().or(z.literal("")),
  seasons: z.array(SeasonSchema).min(1, "Thêm ít nhất 1 mùa"),
});

type SeriesFormInput = z.input<typeof SeriesSchema>;

/* ========================
   Small helpers
======================== */
function usePreview(file?: File | null) {
  const [url, setUrl] = useState<string>("");
  useEffect(() => {
    if (!file) return setUrl("");
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function Field({
  label,
  children,
  help,
}: {
  label: string;
  children: React.ReactNode;
  help?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-white/80">{label}</label>
      {children}
      {help ? <p className="text-xs text-white/60">{help}</p> : null}
    </div>
  );
}

/* ========================
   Component
======================== */
export default function UploadSeriesPage() {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SeriesFormInput>({
    resolver: zodResolver(SeriesSchema),
    defaultValues: {
      title: "",
      originalTitle: "",
      year: `${new Date().getFullYear()}`,
      country: "Mỹ",
      language: "Tiếng Anh",
      rating: "P",
      genres: [],
      overview: "",
      trailerUrl: "",
      seasons: [
        {
          seasonNumber: 1,
          title: "Phần 1",
          episodes: [
            { number: 1, title: "Tập 1", duration: 24, videoUrl: "" },
            { number: 2, title: "Tập 2", duration: 24, videoUrl: "" },
          ],
        },
      ],
    },
  });

  // file previews
  const posterFile = watch("posterFile") as File | undefined;
  const bannerFile = watch("bannerFile") as File | undefined;
  const posterPreview = usePreview(posterFile);
  const bannerPreview = usePreview(bannerFile);

  // field arrays
  const seasonsFA = useFieldArray({ control, name: "seasons" });

  const onAddSeason = () => {
    const nextIndex = (watch("seasons")?.length || 0) + 1;
    seasonsFA.append({
      seasonNumber: nextIndex,
      title: `Phần ${nextIndex}`,
      episodes: [{ number: 1, title: "Tập 1", duration: 24, videoUrl: "" }],
    });
  };

  const onSubmit: SubmitHandler<SeriesFormInput> = (data) => {
    // Chuẩn bị payload để gọi API (multipart nếu có file)
    // Ở đây demo log ra:
    const payload = {
      ...data,
      posterFile: posterFile ? posterFile.name : undefined,
      bannerFile: bannerFile ? bannerFile.name : undefined,
    };
    console.log("UPLOAD SERIES PAYLOAD:", payload);
    alert("Đã chuẩn bị dữ liệu tải phim bộ (xem console). Kết nối API sau nhé!");
  };

  return (
    <div className="w-full px-3 py-4 md:px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Tải phim bộ</h1>
          <p className="text-sm text-white/70">Tạo series mới với thông tin chi tiết</p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/15">
            Tải danh sách
          </button>
          <button className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/15">
            Quản lý người đăng
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,280px] xl:grid-cols-[1fr,320px]">
        {/* LEFT */}
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          {/* Basic */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tên phim *">
              <input
                {...register("title")}
                placeholder="Tên phim"
                className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
              />
              {errors.title && <p className="text-sm text-red-400">{errors.title.message}</p>}
            </Field>
            <Field label="Tên phim bản gốc">
              <input
                {...register("originalTitle")}
                placeholder="Original title"
                className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </Field>

            <Field label="Năm sản xuất *">
              <select
                {...register("year")}
                className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {errors.year && <p className="text-sm text-red-400">{errors.year.message}</p>}
            </Field>

            <Field label="Quốc gia *">
              <select
                {...register("country")}
                className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.country && <p className="text-sm text-red-400">{errors.country.message}</p>}
            </Field>

            <Field label="Ngôn ngữ *">
              <input
                {...register("language")}
                placeholder="Ví dụ: Tiếng Anh, Tiếng Việt"
                className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
              />
              {errors.language && <p className="text-sm text-red-400">{errors.language.message}</p>}
            </Field>

            <Field label="Phân loại độ tuổi *">
              <select
                {...register("rating")}
                className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
              >
                {AGE_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {errors.rating && <p className="text-sm text-red-400">{errors.rating.message}</p>}
            </Field>
          </div>

          {/* Genres */}
          <Field label="Thể loại *">
            <div className="flex flex-wrap gap-2">
              {GENRES.map((g) => {
                const checked = (watch("genres") || []).includes(g);
                return (
                  <label
                    key={g}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      checked ? "border-cyan-400 bg-cyan-500/20 text-cyan-300" : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={(e) => {
                        const cur = new Set(watch("genres"));
                        if (e.target.checked) cur.add(g);
                        else cur.delete(g);
                        setValue("genres", Array.from(cur));
                      }}
                    />
                    {g}
                  </label>
                );
              })}
            </div>
            {errors.genres && <p className="text-sm text-red-400">{errors.genres.message as string}</p>}
          </Field>

          {/* Overview */}
          <Field label="Nhập mô tả chi tiết *">
            <textarea
              {...register("overview")}
              rows={5}
              className="w-full resize-none rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Tóm tắt nội dung, diễn viên chính, điểm đặc biệt..."
            />
            {errors.overview && <p className="text-sm text-red-400">{errors.overview.message}</p>}
          </Field>

          {/* Media upload (poster, banner, trailer) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Poster">
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center hover:border-cyan-400 hover:bg-white/10 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setValue("posterFile", e.target.files?.[0])}
                  className="hidden"
                />
                <div className="text-white/70">
                  <div className="mb-2 text-2xl">📸</div>
                  <div className="text-sm">Chọn poster</div>
                  <div className="text-xs text-white/50">JPG, PNG</div>
                </div>
              </label>
              {posterPreview ? (
                <img src={posterPreview} className="mt-3 w-32 rounded-lg border border-white/20" />
              ) : null}
            </Field>

            <Field label="Banner">
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center hover:border-cyan-400 hover:bg-white/10 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setValue("bannerFile", e.target.files?.[0])}
                  className="hidden"
                />
                <div className="text-white/70">
                  <div className="mb-2 text-2xl">🖼️</div>
                  <div className="text-sm">Chọn banner</div>
                  <div className="text-xs text-white/50">JPG, PNG</div>
                </div>
              </label>
              {bannerPreview ? (
                <img src={bannerPreview} className="mt-3 w-full rounded-lg border border-white/20" />
              ) : null}
            </Field>
          </div>

          <Field label="Trailer (URL)">
            <input
              {...register("trailerUrl")}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
            />
            {errors.trailerUrl && (
              <p className="text-sm text-red-400">{errors.trailerUrl.message as string}</p>
            )}
          </Field>

          {/* Seasons / Episodes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Danh sách mùa & tập</h3>
              <button
                type="button"
                onClick={onAddSeason}
                className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400"
              >
                + Thêm mùa
              </button>
            </div>

            {seasonsFA.fields.map((sField, sIdx) => {
              const episodesFA = useFieldArray({
                control,
                name: `seasons.${sIdx}.episodes`,
              });

              return (
                <div key={sField.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-sm font-medium text-white/70">Mùa:</label>
                      <input
                        type="number"
                        {...register(`seasons.${sIdx}.seasonNumber`, { valueAsNumber: true })}
                        className="w-24 rounded-lg border border-white/15 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                      <input
                        {...register(`seasons.${sIdx}.title`)}
                        placeholder="Tiêu đề mùa (tuỳ chọn)"
                        className="w-56 rounded-lg border border-white/15 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          episodesFA.append({
                            number: (watch(`seasons.${sIdx}.episodes`)?.length || 0) + 1,
                            title: `Tập ${(watch(`seasons.${sIdx}.episodes`)?.length || 0) + 1}`,
                            duration: 24,
                            videoUrl: "",
                          })
                        }
                        className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/15"
                      >
                        + Thêm tập
                      </button>
                      <button
                        type="button"
                        onClick={() => seasonsFA.remove(sIdx)}
                        className="rounded-lg bg-red-500/20 px-3 py-2 text-sm font-medium text-red-300 ring-1 ring-red-400/30 hover:bg-red-500/30"
                      >
                        Xoá mùa
                      </button>
                    </div>
                  </div>

                  {/* Episodes table-like */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {episodesFA.fields.map((eField, eIdx) => (
                      <div
                        key={eField.id}
                        className="rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white/70">Tập</span>
                            <input
                              type="number"
                              {...register(
                                `seasons.${sIdx}.episodes.${eIdx}.number`,
                                { valueAsNumber: true }
                              )}
                              className="w-20 rounded-lg border border-white/15 bg-white px-2 py-1 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => episodesFA.remove(eIdx)}
                            className="rounded-lg bg-white/10 px-2 py-1 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/15"
                          >
                            Xoá
                          </button>
                        </div>

                        <div className="space-y-2">
                          <input
                            {...register(`seasons.${sIdx}.episodes.${eIdx}.title`)}
                            placeholder="Tiêu đề tập"
                            className="w-full rounded-lg border border-white/15 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
                          />
                          <div className="grid grid-cols-[1fr,1fr] gap-2">
                            <input
                              type="number"
                              {...register(
                                `seasons.${sIdx}.episodes.${eIdx}.duration`,
                                { valueAsNumber: true }
                              )}
                              placeholder="Thời lượng (phút)"
                              className="w-full rounded-lg border border-white/15 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                            <input
                              {...register(`seasons.${sIdx}.episodes.${eIdx}.videoUrl`)}
                              placeholder="URL video / HLS (tuỳ chọn)"
                              className="w-full rounded-lg border border-white/15 bg-white px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Error display per season */}
                  {errors.seasons?.[sIdx]?.episodes && (
                    <p className="mt-2 text-sm text-red-400">
                      {(errors.seasons?.[sIdx]?.episodes as any)?.message}
                    </p>
                  )}
                </div>
              );
            })}

            {typeof errors.seasons?.message === "string" && (
              <p className="text-sm text-red-400">{errors.seasons?.message}</p>
            )}
          </div>
        </div>

        {/* RIGHT (actions) */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">Hành động</h4>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => alert("Lưu nháp (tạm thời)")}
                className="w-full rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/20 hover:bg-white/15"
              >
                Lưu nháp
              </button>
              <button
                type="submit"
                className="w-full rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
              >
                Xác nhận upload
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">Trợ giúp</h4>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>Tạo mùa trước, sau đó thêm các tập.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>Nếu dùng file thật, hãy chuyển sang upload lên S3/Cloud (pre-signed URL).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400">•</span>
                <span>Trường URL video chỉ để test.</span>
              </div>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
