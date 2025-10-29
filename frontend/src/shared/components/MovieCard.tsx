import { getImageUrl } from "../../utils/imageProxy";

type MovieCardProps = {
  title: string;
  subtitle?: string;
  poster: string;
  progress?: number; // 0..100 cho "Phim đã xem"
};
export default function MovieCard({ title, subtitle, poster, progress }: MovieCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10 hover:ring-white/20">
      <img src={getImageUrl(poster)} alt={title} className="aspect-[2/3] w-full object-cover" />
      {typeof progress === "number" && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-white/10">
          <div className="h-full bg-cyan-400" style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className="p-2">
        <div className="line-clamp-1 text-sm font-medium">{title}</div>
        {subtitle && <div className="text-xs text-white/60">{subtitle}</div>}
      </div>
      <button
        className="absolute right-2 top-2 hidden rounded-full bg-black/60 px-2 py-1 text-xs group-hover:block"
        title="Thêm yêu thích"
      >
        ❤
      </button>
    </div>
  );
}
