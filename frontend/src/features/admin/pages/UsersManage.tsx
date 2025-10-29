// src/features/admin/pages/UsersManage.tsx
import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../api";

type Role = "owner" | "admin" | "user";

type UserRow = {
  id: number;
  username: string;
  email: string;
  role: Role;
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#1b2a3a] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-lg leading-none ring-1 ring-white/15 hover:bg-white/15 text-white">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function UsersManage() {
  const [data, setData] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await adminApi.listUsers();
        setData(
          list.map((u) => ({ id: Number(u.id), username: u.username, email: u.email, role: (u.role as any) || 'user' }))
        );
      } catch (e: any) {
        setError(e.message || 'Không tải được danh sách người dùng');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = data;
    if (roleFilter !== "all") list = list.filter((u) => u.role === roleFilter);
    if (debounced) {
      list = list.filter((u) => u.username.toLowerCase().includes(debounced) || u.email.toLowerCase().includes(debounced));
    }
    return list;
  }, [data, roleFilter, debounced]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { if (page > totalPages) setPage(1); }, [totalPages, page]);

  return (
    <div className="w-full px-3 py-4 md:px-4">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Quản lý người dùng</h1>
          <p className="text-sm text-white/70">Tổng cộng {data.length} tài khoản</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm theo tên / email"
            className="w-64 rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none placeholder:text-white/60"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="rounded-xl bg-white/90 px-3 py-2 text-sm text-slate-900"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="owner">Chủ hệ thống</option>
            <option value="admin">Quản trị viên</option>
            <option value="user">Người dùng</option>
          </select>
          <button onClick={() => setOpenCreate(true)} className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-white/20 hover:bg-white/10 text-white">Tạo tài khoản</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl ring-1 ring-white/10">
        <div className="grid grid-cols-12 bg-white/5 px-3 py-2 text-xs text-white/70">
          <div className="col-span-5">Tên</div>
          <div className="col-span-5">Email</div>
          <div className="col-span-2 text-right">Thao tác</div>
        </div>

        {loading && <div className="p-6 text-white/70">Đang tải…</div>}
        {error && <div className="p-6 text-rose-400">{error}</div>}
        {!loading && !error && (
          current.length ? (
            current.map((u) => (
              <div key={u.id} className="grid grid-cols-12 items-center px-3 py-2 ring-1 ring-white/5">
                <div className="col-span-5 truncate text-sm text-white">{u.username}</div>
                <div className="col-span-5 truncate text-sm text-white/80">{u.email}</div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button className="rounded-lg px-2.5 py-1.5 text-xs ring-1 ring-white/20 hover:bg-white/10" onClick={() => setEditUser(u)}>Sửa</button>
                  {u.role !== 'owner' && (
                    <button className="rounded-lg px-2.5 py-1.5 text-xs text-rose-300 ring-1 ring-rose-400/30 hover:bg-rose-400/10" onClick={() => setDeleteUser(u)}>Xóa</button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-white/70">Không có dữ liệu</div>
          )
        )}
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between text-sm text-white">
        <div className="text-white/70">Trang {page}/{totalPages}</div>
        <div className="flex items-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg px-3 py-1.5 ring-1 ring-white/20 disabled:opacity-50">Trước</button>
          <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg px-3 py-1.5 ring-1 ring-white/20 disabled:opacity-50">Sau</button>
          <select value={pageSize} onChange={(e) => setPageSize(parseInt(e.target.value, 10))} className="rounded-lg bg-white/90 px-2 py-1 text-slate-900 ring-1 ring-white/20">
            {[6, 12, 24, 48].map((n) => (<option key={n} value={n}>{n}/trang</option>))}
          </select>
        </div>
      </div>

      {/* Edit modal */}
      {editUser && (
        <Modal title="Chỉnh sửa tài khoản" onClose={() => setEditUser(null)}>
          <EditUserForm
            user={editUser}
            onCancel={() => setEditUser(null)}
            onSaved={async (patch) => {
              await adminApi.updateUser(editUser.id, patch);
              setEditUser(null);
              const list = await adminApi.listUsers();
              setData(list.map((u) => ({ id: Number(u.id), username: u.username, email: u.email, role: (u.role as any) || 'user' })));
            }}
          />
        </Modal>
      )}

      {/* Delete modal */}
      {deleteUser && (
        <Modal title="Xóa tài khoản" onClose={() => setDeleteUser(null)}>
          <div className="space-y-3 text-white">
            <div className="rounded-lg bg-white/10 p-3 text-sm ring-1 ring-white/15">
              Bạn có chắc chắn muốn xóa tài khoản <span className="font-semibold">{deleteUser.username}</span>?
            </div>
            <div className="text-right">
              <button className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white hover:bg-rose-400" onClick={async () => {
                await adminApi.deleteUser(deleteUser.id);
                setDeleteUser(null);
                setData((s) => s.filter((x) => x.id !== deleteUser.id));
              }}>Xóa</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create modal */}
      {openCreate && (
        <Modal title="Tạo tài khoản mới" onClose={() => setOpenCreate(false)}>
          <CreateUserForm
            onCreated={async () => {
              setOpenCreate(false);
              const list = await adminApi.listUsers();
              setData(list.map((u) => ({ id: Number(u.id), username: u.username, email: u.email, role: (u.role as any) || 'user' })));
            }}
            onCancel={() => setOpenCreate(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function EditUserForm({ user, onSaved, onCancel }: { user: UserRow; onSaved: (patch: { username: string; email: string; role_id?: number }) => void; onCancel: () => void }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(user.role);
  const [saving, setSaving] = useState(false);
  return (
    <div className="space-y-4 text-white">
      <label className="block space-y-1">
        <span className="text-sm text-white/70">Tên hiển thị</span>
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-white/70">Email</span>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-white/70">Vai trò</span>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400">
          <option value="owner">Chủ hệ thống</option>
          <option value="admin">Quản trị viên</option>
          <option value="user">Người dùng</option>
        </select>
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button className="rounded-lg px-3 py-2 text-sm ring-1 ring-white/20 text-white hover:bg-white/10" onClick={onCancel}>Hủy</button>
        <button disabled={saving} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400 disabled:opacity-60" onClick={async () => {
          try { setSaving(true); await onSaved({ username, email }); } finally { setSaving(false); }
        }}>Lưu</button>
      </div>
    </div>
  );
}

function CreateUserForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("user");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-4 text-white">
      {err && <div className="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-300 ring-1 ring-rose-400/30">{err}</div>}
      <label className="block space-y-1">
        <span className="text-sm text-white/70">Tên người dùng</span>
        <input autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400" placeholder="Nhập tên người dùng" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-white/70">Email</span>
        <input autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400" placeholder="name@example.com" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-white/70">Mật khẩu</span>
        <input autoComplete="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400" placeholder="••••••••" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm text-white/70">Vai trò</span>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="w-full rounded-xl border border-white/15 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-400">
          <option value="admin">Quản trị viên</option>
          <option value="user">Người dùng</option>
        </select>
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button className="rounded-lg px-3 py-2 text-sm ring-1 ring-white/20 text-white hover:bg-white/10" onClick={() => { setUsername(""); setEmail(""); setPassword(""); setRole("user"); onCancel(); }}>Hủy</button>
        <button disabled={loading} className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400 disabled:opacity-60" onClick={async () => {
          try { setErr(null); setLoading(true); await adminApi.createUser({ username, email, password, role_id: role === 'admin' ? 1 : 3 }); onCreated(); }
          catch (e: any) { setErr(e.message || 'Không thể tạo người dùng'); }
          finally { setLoading(false); }
        }}>Tạo</button>
      </div>
    </div>
  );
}
