// filepath: d:\PhimHub\backend\src\jobs\media-download-worker.ts
import cron from 'node-cron';
import { DownloadQueueService } from '../services/download-queue.service';

export function startMediaDownloadWorker() {
  const enabled = (process.env.MEDIA_DL_ENABLED || 'true').toLowerCase() !== 'false';
  if (!enabled) {
    console.log('[media-dl] background worker disabled by env');
    return;
  }

  const cronExp = process.env.MEDIA_DL_CRON || '*/1 * * * *'; // every minute
  const batch = Math.max(1, parseInt(process.env.MEDIA_DL_BATCH || '5'));

  console.log(`[media-dl] Scheduling background worker CRON="${cronExp}" batch=${batch}`);

  const queue = new DownloadQueueService();
  cron.schedule(cronExp, async () => {
    try {
      let processed = 0;
      for (let i = 0; i < batch; i++) {
        const progressed = await queue.processOne();
        if (!progressed) break;
        processed++;
      }
      if (processed > 0) console.log(`[media-dl] processed ${processed} item(s)`);
    } catch (e: any) {
      console.warn('[media-dl] tick error:', e?.message || e);
    }
  });
}
