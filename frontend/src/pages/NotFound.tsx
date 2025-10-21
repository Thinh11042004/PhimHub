import { Link, useLocation } from "react-router-dom";

export default function NotFound() {
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-white/10 text-3xl">
          404
        </div>
        <h1 className="text-2xl font-semibold">Không tìm thấy trang</h1>
        <p className="mt-2 text-white/70">
          Đường dẫn <span className="font-mono text-white/90">{pathname}</span> không tồn tại
          hoặc đã được di chuyển.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-full bg-cyan-500 px-4 py-2 font-medium text-slate-900 hover:bg-cyan-400"
          >
            ← Về trang chủ
          </Link>
          <Link
            to="/movies"
            className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/15"
          >
            Xem phim lẻ
          </Link>
          <Link
            to="/series"
            className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/15"
          >
            Xem phim bộ
          </Link>
        </div>
      </div>

      <p className="mt-6 text-sm text-white/60">
        Hoặc thử tìm kiếm: <Link to="/search" className="underline">/search</Link>
      </p>
    </div>
  );
}
