// filepath: d:\\PhimHub\\backend\\src\\services\\media.service.ts
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import crypto from 'crypto';

export type DownloadKind = 'image' | 'hls';

export interface MediaPathsConfig {
  rootDir: string; // absolute path to uploads dir
  imagesDir: string; // relative: images
  hlsDir: string;    // relative: hls
}

export class MediaService {
  private cfg: MediaPathsConfig;

  constructor(cfg?: Partial<MediaPathsConfig>) {
    const root = cfg?.rootDir || path.join(__dirname, '../../uploads');
    this.cfg = {
      rootDir: root,
      imagesDir: 'images',
      hlsDir: 'hls',
    };
    this.ensureDirs();
  }

  private ensureDirs() {
    const ensure = (p: string) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
    ensure(this.cfg.rootDir);
    ensure(path.join(this.cfg.rootDir, this.cfg.imagesDir));
    ensure(path.join(this.cfg.rootDir, this.cfg.hlsDir));
  }

  public getLocalImagePath(movieSlug: string, type: 'thumb' | 'banner', ext = 'jpg'): string {
    const safe = movieSlug.replace(/[^a-z0-9-_]/gi, '_');
    return path.join(this.cfg.imagesDir, `${safe}.${type}.${ext}`);
  }

  public getLocalHlsDir(movieSlug: string, episodeNumber: number): string {
    const safe = movieSlug.replace(/[^a-z0-9-_]/gi, '_');
    return path.join(this.cfg.hlsDir, safe, `ep-${episodeNumber}`);
  }

  public async downloadImage(url: string, destRelative: string): Promise<string> {
    const abs = path.join(this.cfg.rootDir, destRelative);
    await fs.promises.mkdir(path.dirname(abs), { recursive: true });
    const resp = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
    await fs.promises.writeFile(abs, resp.data);
    return destRelative;
  }

  // Advanced HLS fetcher: downloads master + top-N variants, supports AES-128 decryption, rewrites playlists to local files
  public async downloadHlsPlaylist(playlistUrl: string, destDirRelative: string): Promise<string> {
    const absDir = path.join(this.cfg.rootDir, destDirRelative);
    await fs.promises.mkdir(absDir, { recursive: true });

    const timeout = parseInt(process.env.MEDIA_DL_TIMEOUT || '20000');
    const maxRetries = Math.max(0, parseInt(process.env.MEDIA_DL_RETRY || '2'));
    const maxVariants = Math.max(1, parseInt(process.env.MEDIA_DL_MAX_VARIANTS || '1'));

    // Helpers with simple retry
    const fetchText = async (url: string): Promise<string> => {
      let lastErr: any;
      for (let i = 0; i <= maxRetries; i++) {
        try {
          const res = await axios.get(url, { responseType: 'text', timeout });
          return res.data as string;
        } catch (e) { lastErr = e; }
      }
      throw lastErr;
    };
    const fetchBin = async (url: string): Promise<Buffer> => {
      let lastErr: any;
      for (let i = 0; i <= maxRetries; i++) {
        try {
          const res = await axios.get(url, { responseType: 'arraybuffer', timeout });
          return Buffer.from(res.data);
        } catch (e) { lastErr = e; }
      }
      throw lastErr;
    };

    const masterContent = await fetchText(playlistUrl);
    const masterUrl = new URL(playlistUrl);

    // Detect if the provided URL is already a media playlist (no EXT-X-STREAM-INF)
    const hasStreamInf = /#EXT-X-STREAM-INF:/i.test(masterContent);

    type VariantInfo = { uri: string; absUrl: string; bandwidth?: number };
    let variants: VariantInfo[] = [];

    if (hasStreamInf) {
      const lines = masterContent.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#EXT-X-STREAM-INF')) {
          const bwMatch = line.match(/BANDWIDTH=(\d+)/i);
          const next = lines[i + 1] || '';
          if (next && !next.startsWith('#')) {
            const uri = next.trim();
            const absUrl = new URL(uri, masterUrl).toString();
            variants.push({ uri, absUrl, bandwidth: bwMatch ? parseInt(bwMatch[1], 10) : undefined });
          }
        }
      }
      variants.sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0));
      if (variants.length === 0) {
        // Fallback: treat master as media
        variants = [{ uri: 'index.m3u8', absUrl: playlistUrl }];
      }
    } else {
      // No variants; treat as media playlist directly
      variants = [{ uri: 'index.m3u8', absUrl: playlistUrl }];
    }

    // Process up to N variants
    const selected = variants.slice(0, maxVariants);

    const localVariantFiles: string[] = [];

    const processVariant = async (absUrl: string, localName: string): Promise<string> => {
      const mediaText = await fetchText(absUrl);
      const mediaUrl = new URL(absUrl);
      const outPath = path.join(absDir, localName);

      // State for AES-128
      let currentKey: Buffer | null = null;
      let currentIv: Buffer | null = null;
      let mediaSeq = 0;

      const outLines: string[] = [];
      const lines = mediaText.split(/\r?\n/);
      for (let i = 0, segIndex = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#EXT-X-KEY')) {
          // Parse METHOD, URI, IV
          const method = (/METHOD=([^,]+)/.exec(line)?.[1] || '').toUpperCase();
          const uriRaw = /URI="([^"]+)"/.exec(line)?.[1];
          const ivHex = /IV=0x([0-9A-Fa-f]+)/.exec(line)?.[1];
          if (method === 'AES-128' && uriRaw) {
            try {
              const keyUrl = new URL(uriRaw, mediaUrl).toString();
              currentKey = await fetchBin(keyUrl);
              currentIv = ivHex ? Buffer.from(ivHex, 'hex') : null;
            } catch {
              currentKey = null; currentIv = null;
            }
          } else {
            currentKey = null; currentIv = null;
          }
          // We will remove key lines since we store decrypted segments locally
          continue;
        }
        if (line.startsWith('#EXT-X-MEDIA-SEQUENCE')) {
          const m = line.match(/:([0-9]+)/);
          mediaSeq = m ? parseInt(m[1], 10) : 0;
          outLines.push(line);
          continue;
        }
        if (line.startsWith('#')) {
          outLines.push(line);
          continue;
        }
        // Segment URI
        const segRel = line.trim();
        if (!segRel) continue;
        const segUrl = new URL(segRel, mediaUrl).toString();
        const segName = path.basename(segUrl.split('?')[0]);
        const segPath = path.join(absDir, segName);
        try {
          const data = await fetchBin(segUrl);
          let toWrite = data;
          if (currentKey) {
            const iv = currentIv || (() => {
              // Default IV is sequence number as 16-byte big-endian
              const n = mediaSeq + segIndex;
              const buf = Buffer.alloc(16);
              buf.writeUInt32BE(n >>> 0, 12);
              return buf;
            })();
            try {
              const decipher = crypto.createDecipheriv('aes-128-cbc', currentKey, iv);
              toWrite = Buffer.concat([decipher.update(data), decipher.final()]);
            } catch {
              // If decryption fails, fallback to raw
              toWrite = data;
            }
          }
          await fs.promises.writeFile(segPath, toWrite);
          outLines.push(segName);
          segIndex++;
        } catch {
          // Skip segment but keep original URL for resilience
          outLines.push(segName);
          segIndex++;
        }
      }

      await fs.promises.writeFile(outPath, outLines.join('\n'), 'utf8');
      return localName;
    };

    // Write original master for reference
    await fs.promises.writeFile(path.join(absDir, 'master.remote.m3u8'), masterContent, 'utf8');

    // Process selected variants
    for (let i = 0; i < selected.length; i++) {
      const localName = maxVariants === 1 ? 'index.m3u8' : `variant_${i}.m3u8`;
      const saved = await processVariant(selected[i].absUrl, localName);
      localVariantFiles.push(saved);
      if (i === 0 && localName !== 'index.m3u8') {
        // Also write primary variant as index.m3u8 for compatibility
        const src = path.join(absDir, localName);
        const dst = path.join(absDir, 'index.m3u8');
        await fs.promises.copyFile(src, dst);
      }
    }

    // If we had a master with variants, write a rewritten local master
    if (hasStreamInf) {
      const lines = masterContent.split(/\r?\n/);
      const rewritten: string[] = [];
      let vidx = 0;
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        if (l.startsWith('#EXT-X-STREAM-INF')) {
          rewritten.push(l);
          const next = lines[i + 1] || '';
          if (next && !next.startsWith('#')) {
            const localRef = localVariantFiles[vidx] || localVariantFiles[0] || 'index.m3u8';
            rewritten.push(localRef);
            i++; // skip original uri line
            vidx++;
            continue;
          }
        }
        rewritten.push(l);
      }
      await fs.promises.writeFile(path.join(absDir, 'master.m3u8'), rewritten.join('\n'), 'utf8');
    } else {
      // Save a simple master pointing to index
      await fs.promises.writeFile(path.join(absDir, 'master.m3u8'), ['#EXTM3U', 'index.m3u8'].join('\n'), 'utf8');
    }

    return destDirRelative;
  }
}
