import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api";

type Genre = { id: number; name: string; movie_count?: number };

// ===== UI helpers =====
function Modal({
  title, children, onClose,
}: { title: string; children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#22364a] shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center justify-between rounded-t-2xl border-b border-white/10 px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg leading-none ring-1 ring-white/15 hover:bg-white/15"
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ===== Page =====
export default function GenresManage() {
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<Genre | null>(null);
  const [showDelete, setShowDelete] = useState<Genre | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await adminApi.listGenres();
        setGenres(data as any);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // CRUD actions
  const createGenre = async (name: string) => {
    await adminApi.createGenre(name);
    const data = await adminApi.listGenres();
    setGenres(data as any);
  };
  const updateGenre = async (id: number, name: string) => {
    await adminApi.updateGenre(id, name);
    const data = await adminApi.listGenres();
    setGenres(data as any);
  };
  const deleteGenre = async (id: number) => {
    await adminApi.deleteGenre(id);
    setGenres((s) => s.filter((g) => g.id !== id));
  };

  const filtered = useMemo(() => {
    if (!debounced) return genres;
    return genres.filter((g) => g.name.toLowerCase().includes(debounced));
  }, [genres, debounced]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-5 text-white md:px-4">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Quản lý thể loại</h1>
          <p className="text-sm text-white/70">Tổng cộng {genres.length} thể loại</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm thể loại…"
            className="w-56 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm outline-none placeholder:text-white/60 focus:ring-2 focus:ring-cyan-400/60"
          />
          <button
            className="rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-white/20 hover:bg-white/10"
            onClick={() => setShowAdd(true)}
          >
            Thêm thể loại
          </button>
          <Link to="/admin" className="rounded-lg bg-white/10 px-3 py-2 text-sm hover:bg-white/15">Quay lại Admin</Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-3 py-2 text-xs text-white/70">
          <div className="col-span-7">Tên thể loại</div>
          <div className="col-span-3">Số lượng phim</div>
          <div className="col-span-2 text-right">Thao tác</div>
        </div>
        {loading ? (
          <div className="p-6 text-center text-white/70">Đang tải…</div>
        ) : current.length ? (
          current.map((g) => (
            <div key={g.id} className="grid grid-cols-12 items-center px-3 py-2 ring-1 ring-white/5">
              <div className="col-span-7 truncate text-sm font-medium">{g.name}</div>
              <div className="col-span-3 text-sm text-white/80">{g.movie_count ?? 0} phim</div>
              <div className="col-span-2 flex items-center justify-end gap-2">
                <button
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 ring-white/20 hover:bg-white/10"
                  onClick={() => setShowEdit(g)}
                >
                  Sửa
                </button>
                <button
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-400/10"
                  onClick={() => setShowDelete(g)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-white/70">Không có dữ liệu</div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="text-white/70">Trang {page}/{totalPages}</div>
        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg px-3 py-1.5 ring-1 ring-white/20 disabled:opacity-50"
          >
            Trước
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg px-3 py-1.5 ring-1 ring-white/20 disabled:opacity-50"
          >
            Sau
          </button>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
            className="rounded-lg bg-white/90 px-2 py-1 text-slate-900 ring-1 ring-white/20"
          >
            {[6, 12, 24, 48].map((n) => (
              <option key={n} value={n}>{n}/trang</option>
            ))}
          </select>
        </div>
      </div>

      {/* Modals */}
      {showAdd && (
        <Modal title="Thêm thể loại" onClose={() => setShowAdd(false)}>
          <AddGenreForm
            onCancel={() => setShowAdd(false)}
            onSubmit={async (name) => {
              await createGenre(name);
              setShowAdd(false);
            }}
          />
        </Modal>
      )}
      {showEdit && (
        <Modal title="Sửa thể loại" onClose={() => setShowEdit(null)}>
          <EditGenreForm
            genre={showEdit}
            onCancel={() => setShowEdit(null)}
            onSubmit={async (name) => {
              await updateGenre(showEdit.id, name);
              setShowEdit(null);
            }}
          />
        </Modal>
      )}
      {showDelete && (
        <Modal title="Xóa thể loại" onClose={() => setShowDelete(null)}>
          <DeleteGenreConfirm
            genre={showDelete}
            onCancel={() => setShowDelete(null)}
            onConfirm={async () => {
              await deleteGenre(showDelete.id);
              setShowDelete(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
 
// ===== Forms =====
function AddGenreForm({ onSubmit, onCancel }: { onSubmit: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit(name.trim());
      }}
    >
      <label className="block space-y-1">
        <span className="text-sm text-white/80">Tên thể loại</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Tâm lý"
          className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-2 text-slate-900 outline-none placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-400"
        />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">Hủy</button>
        <button className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-300">Tạo</button>
      </div>
    </form>
  );
}

function EditGenreForm({ genre, onSubmit, onCancel }: { genre: Genre; onSubmit: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState(genre.name);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit(name.trim());
      }}
    >
      <label className="block space-y-1">
        <span className="text-sm text-white/80">Tên thể loại</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-white/15 bg-white/95 px-3 py-2 text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </label>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">Hủy</button>
        <button className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-300">Lưu</button>
      </div>
    </form>
  );
}

function DeleteGenreConfirm({ genre, onConfirm, onCancel }: { genre: Genre; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white/10 p-3 text-sm ring-1 ring-white/15">
        Bạn có chắc chắn muốn xóa thể loại
        <span className="mx-1 font-semibold">{genre.name}</span>
        ? Hành động này không thể hoàn tác.
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg px-3 py-2 text-sm ring-1 ring-white/20 hover:bg-white/10">Hủy</button>
        <button onClick={onConfirm} className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium hover:bg-rose-400">Xóa</button>
      </div>
    </div>
  );
}
