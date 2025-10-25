// filepath: d:\\PhimHub\\backend\\src\\services\\download-queue.service.ts
import Database from '../config/database';
import sql from 'mssql';
import { MediaService } from './media.service';

export class DownloadQueueService {
  private db = Database.getInstance();
  private media = new MediaService();

  async enqueueImage(movieId: number, url: string, targetPath: string): Promise<void> {
    const pool = this.db.getPool();
    await pool.request()
      .input('kind', sql.NVarChar, 'image')
      .input('movie_id', sql.Int, movieId)
      .input('source_url', sql.NVarChar, url)
      .input('target_path', sql.NVarChar, targetPath)
      .query(`INSERT INTO dbo.media_downloads(kind, movie_id, source_url, target_path) VALUES(@kind, @movie_id, @source_url, @target_path)`);
  }

  async enqueueHls(episodeId: number, url: string, targetDir: string): Promise<void> {
    const pool = this.db.getPool();
    await pool.request()
      .input('kind', sql.NVarChar, 'hls')
      .input('episode_id', sql.Int, episodeId)
      .input('source_url', sql.NVarChar, url)
      .input('target_path', sql.NVarChar, targetDir)
      .query(`INSERT INTO dbo.media_downloads(kind, episode_id, source_url, target_path) VALUES(@kind, @episode_id, @source_url, @target_path)`);
  }

  async processOne(): Promise<boolean> {
    const pool = this.db.getPool();
    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      const pick = await tx.request().query(`
        UPDATE TOP (1) dbo.media_downloads
        SET status = 'in_progress', started_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME(), attempt_count = attempt_count + 1
        OUTPUT INSERTED.*
        WHERE id IN (
          SELECT TOP (1) id FROM dbo.media_downloads WHERE status = 'pending' ORDER BY priority DESC, created_at ASC
        );
      `);
      const job = pick.recordset[0];
      if (!job) { await tx.commit(); return false; }

      try {
        if (job.kind === 'image') {
          await this.media.downloadImage(job.source_url, job.target_path);
          // Reflect into movies: set local paths and switch thumbnail/banner urls to local
          const isThumb = /\.thumb\./i.test(job.target_path || '');
          const isBanner = /\.banner\./i.test(job.target_path || '');
          const localUrl = `/uploads/${job.target_path}`.replace(/\\/g, '/');
          if (isThumb) {
            await tx.request()
              .input('movie_id', sql.Int, job.movie_id)
              .input('p', sql.NVarChar, job.target_path)
              .input('u', sql.NVarChar, localUrl)
              .query(`UPDATE dbo.movies SET local_thumbnail_path=@p, thumbnail_url=@u WHERE id=@movie_id`);
          } else if (isBanner) {
            await tx.request()
              .input('movie_id', sql.Int, job.movie_id)
              .input('p', sql.NVarChar, job.target_path)
              .input('u', sql.NVarChar, localUrl)
              .query(`UPDATE dbo.movies SET local_banner_path=@p, banner_url=@u WHERE id=@movie_id`);
          }
        } else {
          await this.media.downloadHlsPlaylist(job.source_url, job.target_path);
          const localIndexUrl = `/uploads/${job.target_path.replace(/\\/g, '/')}/index.m3u8`;
          await tx.request()
            .input('episode_id', sql.Int, job.episode_id)
            .input('p', sql.NVarChar, job.target_path)
            .input('u', sql.NVarChar, localIndexUrl)
            .query(`UPDATE dbo.episodes SET local_hls_path=@p, episode_url=@u, download_status='completed', last_download_at=SYSUTCDATETIME() WHERE id=@episode_id`);
        }
        await tx.request().input('id', sql.Int, job.id)
          .query(`UPDATE dbo.media_downloads SET status='completed', finished_at = SYSUTCDATETIME(), updated_at = SYSUTCDATETIME() WHERE id=@id`);
      } catch (e: any) {
        if (job.kind === 'hls' && job.episode_id) {
          await tx.request()
            .input('episode_id', sql.Int, job.episode_id)
            .input('err', sql.NVarChar, e?.message || String(e))
            .query(`UPDATE dbo.episodes SET download_status='failed', last_download_error=@err, last_download_at=SYSUTCDATETIME() WHERE id=@episode_id`);
        }
        await tx.request().input('id', sql.Int, job.id).input('err', sql.NVarChar, e?.message || String(e))
          .query(`UPDATE dbo.media_downloads SET status='failed', last_error=@err, updated_at = SYSUTCDATETIME() WHERE id=@id`);
      }

      await tx.commit();
      return true;
    } catch (e) {
      try { await tx.rollback(); } catch {}
      throw e;
    }
  }
}
