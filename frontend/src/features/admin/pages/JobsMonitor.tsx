import { useEffect, useMemo, useState } from 'react';

// Compute backend base (strip trailing /api from API_BASE_URL)
function getBackendBase(): string {
  const api = (window as any).APP_API_BASE_URL || (import.meta as any).env?.VITE_API_BASE_URL || '';
  const fromHttp = api || (typeof window !== 'undefined' ? `${window.location.origin}/api` : '');
  return fromHttp.replace(/\/?api\/?$/, '');
}

type JobRun = {
  id: number;
  job_name: string;
  status: 'running' | 'success' | 'failed';
  started_at: string;
  finished_at?: string | null;
  payload?: string | null;
  result?: string | null;
  error?: string | null;
};

type MediaItem = {
  id: number;
  kind: 'image' | 'hls';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  attempt_count: number;
  movie_id?: number | null;
  episode_id?: number | null;
  source_url: string;
  target_path?: string | null;
  last_error?: string | null;
  created_at: string;
  updated_at?: string | null;
  started_at?: string | null;
  finished_at?: string | null;
};

type Tab = 'runs' | 'media';

export default function JobsMonitor() {
  const [tab, setTab] = useState<Tab>('runs');
  const [runs, setRuns] = useState<JobRun[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{ status?: string; kind?: string }>({});
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(25);

  const backendBase = useMemo(() => getBackendBase(), []);

  const authHeader = useMemo(() => {
    const token = localStorage.getItem('phimhub:token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ offset: String(page * limit), limit: String(limit) });
      const res = await fetch(`${backendBase}/jobs/runs?${qs.toString()}`, { headers: { 'Content-Type': 'application/json', ...authHeader }, credentials: 'include' });
      const data = await res.json();
      setRuns(data.items || []);
    } catch {
      setRuns([]);
    } finally { setLoading(false); }
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ offset: String(page * limit), limit: String(limit) });
      if (filters.status) qs.set('status', filters.status);
      if (filters.kind) qs.set('kind', filters.kind);
      const res = await fetch(`${backendBase}/jobs/media?${qs.toString()}`, { headers: { 'Content-Type': 'application/json', ...authHeader }, credentials: 'include' });
      const data = await res.json();
      setMedia(data.items || []);
    } catch {
      setMedia([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'runs') fetchRuns(); else fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, limit, filters.status, filters.kind]);

  const retryMedia = async (id: number) => {
    await fetch(`${backendBase}/jobs/media/retry/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, credentials: 'include' });
    await fetchMedia();
  };

  const processOne = async () => {
    await fetch(`${backendBase}/jobs/media/process-one`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeader }, credentials: 'include' });
    await fetchMedia();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-full bg-white/5 p-1 ring-1 ring-white/10">
          <button className={`rounded-full px-3 py-1 text-sm ${tab==='runs'?'bg-white/20':'hover:bg-white/10'}`} onClick={() => setTab('runs')}>Job runs</button>
          <button className={`rounded-full px-3 py-1 text-sm ${tab==='media'?'bg-white/20':'hover:bg-white/10'}`} onClick={() => setTab('media')}>Media downloads</button>
        </div>
        {tab==='media' && (
          <div className="flex items-center gap-2">
            <select className="rounded-md bg-white/10 px-2 py-1 text-sm" value={filters.kind||''} onChange={e => setFilters(f => ({...f, kind: e.target.value || undefined}))}>
              <option value="">All kinds</option>
              <option value="image">Image</option>
              <option value="hls">HLS</option>
            </select>
            <select className="rounded-md bg-white/10 px-2 py-1 text-sm" value={filters.status||''} onChange={e => setFilters(f => ({...f, status: e.target.value || undefined}))}>
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            <button onClick={processOne} className="rounded-md bg-white/10 px-3 py-1 text-sm ring-1 ring-white/15 hover:bg-white/15">Process one</button>
          </div>
        )}
      </div>

      {tab === 'runs' ? (
        <div className="overflow-auto rounded-xl ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr>
                <Th>ID</Th>
                <Th>Job</Th>
                <Th>Status</Th>
                <Th>Started</Th>
                <Th>Finished</Th>
              </tr>
            </thead>
            <tbody>
              {runs.map(r => (
                <tr key={r.id} className="border-t border-white/10">
                  <Td>{r.id}</Td>
                  <Td>{r.job_name}</Td>
                  <Td><Badge status={r.status} /></Td>
                  <Td>{fmtDate(r.started_at)}</Td>
                  <Td>{fmtDate(r.finished_at)}</Td>
                </tr>
              ))}
              {!runs.length && (
                <tr><Td colSpan={5} className="p-4 text-center text-white/60">{loading?'Đang tải...':'Không có dữ liệu'}</Td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl ring-1 ring-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/10">
              <tr>
                <Th>ID</Th>
                <Th>Kind</Th>
                <Th>Status</Th>
                <Th>Attempts</Th>
                <Th>Movie</Th>
                <Th>Episode</Th>
                <Th>Target</Th>
                <Th>Created</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {media.map(m => (
                <tr key={m.id} className="border-t border-white/10">
                  <Td>{m.id}</Td>
                  <Td>{m.kind}</Td>
                  <Td><Badge status={m.status} /></Td>
                  <Td>{m.attempt_count}</Td>
                  <Td>{m.movie_id ?? ''}</Td>
                  <Td>{m.episode_id ?? ''}</Td>
                  <Td className="max-w-[320px] truncate" title={m.target_path || ''}>{m.target_path || ''}</Td>
                  <Td>{fmtDate(m.created_at)}</Td>
                  <Td>
                    {m.status==='failed' || m.status==='pending' ? (
                      <button onClick={() => retryMedia(m.id)} className="rounded bg-white/10 px-2 py-0.5 text-xs ring-1 ring-white/15 hover:bg-white/15">Retry</button>
                    ) : null}
                  </Td>
                </tr>
              ))}
              {!media.length && (
                <tr><Td colSpan={9} className="p-4 text-center text-white/60">{loading?'Đang tải...':'Không có dữ liệu'}</Td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-white/60">Trang {page+1}</div>
        <div className="flex items-center gap-2">
          <button className="rounded bg-white/10 px-2 py-1 text-xs ring-1 ring-white/15 disabled:opacity-50" disabled={page===0} onClick={() => setPage(p => Math.max(0, p-1))}>Prev</button>
          <button className="rounded bg-white/10 px-2 py-1 text-xs ring-1 ring-white/15" onClick={() => setPage(p => p+1)}>Next</button>
          <select className="rounded bg-white/10 px-2 py-1 text-xs" value={limit} onChange={e => setLimit(parseInt(e.target.value))}>
            {[10,25,50,100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: any }) { return <th className="px-3 py-2 text-left font-medium">{children}</th>; }
function Td({ children, colSpan, className, title }: { children: any; colSpan?: number; className?: string; title?: string }) { 
  return <td colSpan={colSpan} className={className || "px-3 py-2"} title={title}>{children}</td>; 
}

function Badge({ status }: { status: string }) {
  const cls =
    status === 'success' || status === 'completed' ? 'text-emerald-400' :
    status === 'running' || status === 'in_progress' ? 'text-amber-300' :
    status === 'failed' ? 'text-rose-400' : 'text-white/80';
  return <span className={`rounded px-2 py-0.5 text-xs ${cls}`}>{status}</span>;
}

function fmtDate(s?: string | null) {
  if (!s) return '';
  try { return new Date(s).toLocaleString(); } catch { return s; }
}
