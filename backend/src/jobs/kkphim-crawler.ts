import cron from 'node-cron';
import { KKPhimAPIService } from '../services/kkphim-api.service';
import { MovieImportService } from '../services/movie-import.service';
import { MovieService } from '../models/MovieService';
import Database from '../config/database';
import { DownloadQueueService } from '../services/download-queue.service';

export type CrawlResult = {
  startedAt: string;
  finishedAt: string | null;
  pages: number;
  startPage: number;
  version: string;
  processed: number;
  imported: number;
  synced: number;
  skipped: number;
  errors: number;
  pageSummaries?: Array<{ page: number; items: number }>;
  details: Array<{
    slug: string;
    title?: string;
    action: 'imported' | 'synced' | 'skipped' | 'error';
    reason?: string;
    error?: string;
  }>;
};

export interface CrawlOptions {
  pages?: number;
  startPage?: number;
  version?: string;
  delayMs?: number;
}

let lastRun: CrawlResult | null = null;
let isRunning = false;

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function crawlKKPhimOnce(opts: CrawlOptions = {}): Promise<CrawlResult> {
  if (isRunning) {
    return lastRun || {
      startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(), pages: 0, startPage: 0, version: 'v1', processed: 0, imported: 0, synced: 0, skipped: 0, errors: 0, details: [{ slug: '', action: 'skipped', reason: 'concurrency_guard' }]
    } as any;
  }
  isRunning = true;
  const db = Database.getInstance();
  const queue = new DownloadQueueService();

  // Persist job start
  let jobRunId: number | null = null;
  try {
    const pool = db.getPool();
    const ins = await pool.request()
      .input('job_name', 'kkphim_crawl')
      .input('payload', JSON.stringify(opts))
      .query("INSERT INTO dbo.job_runs(job_name, payload) OUTPUT INSERTED.id VALUES(@job_name, @payload)");
    jobRunId = ins.recordset?.[0]?.id ?? null;
  } catch {}

  const pages = Math.max(1, opts.pages ?? parseInt(process.env.KKPHIM_CRAWLER_PAGES || '2'));
  const startPage = Math.max(1, opts.startPage ?? parseInt(process.env.KKPHIM_CRAWLER_START_PAGE || '1'));
  const version = opts.version ?? (process.env.KKPHIM_CRAWLER_VERSION || 'v1');
  const delayMs = Math.max(0, opts.delayMs ?? parseInt(process.env.KKPHIM_CRAWLER_DELAY_MS || '800'));

  const result: CrawlResult = {
    startedAt: new Date().toISOString(),
    finishedAt: null,
    pages,
    startPage,
    version,
    processed: 0,
    imported: 0,
    synced: 0,
    skipped: 0,
    errors: 0,
    pageSummaries: [],
    details: []
  };

  const kkphim = new KKPhimAPIService();
  const importer = new MovieImportService();

  for (let page = startPage; page < startPage + pages; page++) {
    try {
      console.log(`[crawler] Fetching latest list page=${page} version=${version}`);
      const list = await kkphim.getLatestMovies(page, version);
      const items = list?.data?.items || [];
      console.log(`[crawler] Page ${page}: ${items.length} items`);
      result.pageSummaries!.push({ page, items: items.length });

      for (const item of items) {
        result.processed++;
        const slug = item.slug;
        try {
          const existing = await MovieService.findBySlug(slug);
          const detail = await kkphim.getMovieBySlug(slug);
          const episodeServers = Array.isArray(detail?.episodes) ? detail.episodes : [];
          const transformed = kkphim.transformKKPhimToMovie(detail?.movie || item, episodeServers);

          if (!existing) {
            await importer.importMovie(transformed, {
              auto_create_actors: true,
              auto_create_genres: true,
              auto_create_directors: true,
              import_episodes: true,
            });
            result.imported++;
            result.details.push({ slug, title: item.name, action: 'imported' });
            console.log(`  [+] imported ${item.name} (${slug}) eps=${transformed.episodes?.length || 0}`);
          } else {
            await importer.syncMovie(existing.id, transformed, {
              update_episodes: true,
              update_metadata: true,
              preserve_local_changes: true,
            });
            result.synced++;
            result.details.push({ slug, title: item.name, action: 'synced' });
            console.log(`  [~] synced ${item.name} (${slug}) eps=${transformed.episodes?.length || 0}`);
          }
        } catch (e: any) {
          result.errors++;
          const msg = e?.message || String(e);
          result.details.push({ slug, title: item?.name, action: 'error', error: msg });
          console.warn(`  [!] error processing ${slug}: ${msg}`);
        }

        if (delayMs) await sleep(delayMs);
      }
    } catch (pageErr: any) {
      result.errors++;
      console.warn(`[crawler] page ${page} error:`, pageErr?.message || pageErr);
    }
  }

  try {
    result.finishedAt = new Date().toISOString();
    lastRun = result;

    // Update job run end
    try {
      if (jobRunId) {
        const pool = db.getPool();
        await pool.request()
          .input('id', jobRunId)
          .input('status', result.errors > 0 ? 'failed' : 'success')
          .input('result', JSON.stringify(result))
          .query('UPDATE dbo.job_runs SET status=@status, finished_at = SYSUTCDATETIME(), result=@result WHERE id=@id');
      }
    } catch {}

    // Progress media download queue a bit (best-effort)
    try {
      const iterations = parseInt(process.env.MEDIA_DL_ITERATIONS || '3');
      for (let i = 0; i < iterations; i++) {
        const progressed = await queue.processOne();
        if (!progressed) break;
      }
    } catch (e) {
      console.warn('download queue progress error:', (e as any)?.message || e);
    }
  } finally {
    isRunning = false;
  }

  return result;
}

export function getLastKKPhimCrawl(): CrawlResult | null {
  return lastRun;
}

export function startKKPhimScheduler() {
  const enabled = (process.env.KKPHIM_CRAWLER_ENABLED || 'true').toLowerCase() !== 'false';
  if (!enabled) {
    console.log('[crawler] KKPhim scheduler disabled by env');
    return;
  }

  const cronExp = process.env.KKPHIM_CRAWLER_CRON || '0 * * * *'; // every hour at minute 0
  console.log(`[crawler] Scheduling KKPhim crawl with CRON="${cronExp}"`);

  cron.schedule(cronExp, async () => {
    try {
      console.log('[crawler] Scheduled run started');
      const res = await crawlKKPhimOnce();
      console.log(`[crawler] Scheduled run finished: imported=${res.imported} synced=${res.synced} errors=${res.errors}`);
    } catch (e: any) {
      console.error('[crawler] Scheduled run error:', e?.message || e);
    }
  });
}
