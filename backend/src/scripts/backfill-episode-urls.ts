import dotenv from 'dotenv';
import Database from '../config/database';
import { EpisodeRepository } from '../models/EpisodeRepository';
import { MovieRepository } from '../models/MovieRepository';
import { ExternalAPIService, PhimAPIEpisodeServer } from '../services/external-api.service';
import sql from 'mssql';
import fs from 'fs';
import path from 'path';

dotenv.config();

interface CLIOptions {
	limit: number;
	dryRun: boolean;
	movieId?: number;
}

function parseArgs(): CLIOptions {
	const args = process.argv.slice(2);
	let limit = 5;
	let dryRun = false;
	let movieId: number | undefined;

	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (a === '--limit' && args[i + 1]) {
			limit = parseInt(args[++i]);
		} else if (a === '--dry-run' || a === '--dryrun') {
			dryRun = true;
		} else if ((a === '--movie-id' || a === '--movie') && args[i + 1]) {
			movieId = parseInt(args[++i]);
		}
	}

	return { limit, dryRun, movieId };
}

function ensureDir(dir: string) {
	if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const CACHE_DIR = path.resolve(__dirname, './.cache');
const MAP_FILE = path.join(CACHE_DIR, 'phimapi-map.json');
const OVERRIDES_FILE = path.join(CACHE_DIR, 'slug-overrides.json');

type MapEntry = { movieId: number; slug: string };

function loadMap(): Map<number, string> {
	try {
		if (fs.existsSync(MAP_FILE)) {
			const raw = fs.readFileSync(MAP_FILE, 'utf-8');
			const arr: MapEntry[] = JSON.parse(raw);
			const m = new Map<number, string>();
			for (const e of arr) m.set(e.movieId, e.slug);
			return m;
		}
	} catch {}
	return new Map<number, string>();
}

function saveMap(m: Map<number, string>) {
	ensureDir(CACHE_DIR);
	const arr: MapEntry[] = Array.from(m.entries()).map(([movieId, slug]) => ({ movieId, slug }));
	fs.writeFileSync(MAP_FILE, JSON.stringify(arr, null, 2), 'utf-8');
}

type OverrideEntry = { movieId?: number; fromSlug?: string; candidates: string[] };

function loadOverrides(): OverrideEntry[] {
	try {
		if (fs.existsSync(OVERRIDES_FILE)) {
			const raw = fs.readFileSync(OVERRIDES_FILE, 'utf-8');
			const arr: OverrideEntry[] = JSON.parse(raw);
			return Array.isArray(arr) ? arr : [];
		}
	} catch {}
	return [];
}

function getOverrideCandidates(movieId: number, overrides: OverrideEntry[], currentSlug?: string): string[] {
	const list: string[] = [];
	for (const o of overrides) {
		if (o.movieId && o.movieId === movieId) list.push(...o.candidates);
		if (o.fromSlug && currentSlug && o.fromSlug === currentSlug) list.push(...o.candidates);
	}
	return Array.from(new Set(list.filter(Boolean)));
}

async function selectMoviesWithMissingEpisodeUrls(limit: number, movieId?: number): Promise<number[]> {
	const pool = Database.getInstance().getPool();
	const request = pool.request();
	let query = `
		SELECT DISTINCT TOP (@limit) e.movie_id AS movie_id
		FROM episodes e
		INNER JOIN movies m ON m.id = e.movie_id
		WHERE (e.episode_url IS NULL OR LTRIM(RTRIM(e.episode_url)) = '')
		ORDER BY e.movie_id ASC
	`;
	request.input('limit', sql.Int, limit);
	if (movieId) {
		query = `
			SELECT DISTINCT e.movie_id AS movie_id
			FROM episodes e
			WHERE e.movie_id = @movieId AND (e.episode_url IS NULL OR LTRIM(RTRIM(e.episode_url)) = '')
		`;
		request.input('movieId', sql.Int, movieId);
	}
	const res = await request.query(query);
	return res.recordset.map((r: any) => r.movie_id as number);
}

function pickPreferredServer(servers: PhimAPIEpisodeServer[]): PhimAPIEpisodeServer | null {
	if (!servers || servers.length === 0) return null;
	// Prefer servers with m3u8 and common names
	const preferredNames = ['Vietsub', 'Server 1', 'HDX', 'VIP', 'Bilu', 'Nguồn 1'];
	for (const name of preferredNames) {
		const s = servers.find(sv => sv.server_name && sv.server_name.toLowerCase().includes(name.toLowerCase()));
		if (s && s.server_data.some(ep => ep.link_m3u8 && ep.link_m3u8.startsWith('http'))) return s;
	}
	// Otherwise first server with any m3u8
	const foundServer = servers.find(sv => sv.server_data.some(ep => ep.link_m3u8 && ep.link_m3u8.startsWith('http')));
	return foundServer || servers[0];
}

function isValidUrl(u?: string): boolean {
	if (!u) return false;
	if (!/^https?:\/\//i.test(u)) return false;
	return true;
}

function normalizeTitle(s?: string): string {
	if (!s) return '';
	return s
		.normalize('NFD')
		.replace(/\p{Diacritic}+/gu, '')
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function toSlugCandidate(s?: string): string | null {
	const n = normalizeTitle(s);
	if (!n) return null;
	return n.replace(/\s+/g, '-');
}

async function findAlternativeSlug(
	movie: { title?: string; original_title?: string; release_year?: number; slug?: string; id?: number },
	external: ExternalAPIService
): Promise<string | null> {
	// Try derived slug candidates when search API is unavailable/rejecting
	const derived = Array.from(new Set([
		movie.slug || '',
		toSlugCandidate(movie.title) || '',
		toSlugCandidate(movie.original_title) || ''
	].filter(Boolean)));

	// Include manual overrides if provided
	const overrides = loadOverrides();
	const manual = getOverrideCandidates(movie.id as number, overrides, movie.slug);
	const candidates = Array.from(new Set([...manual, ...derived]));

	for (const cand of candidates) {
		try {
			const resp = await external.getMovieBySlug(cand);
			if (resp && Array.isArray(resp.episodes) && resp.episodes.length > 0) return cand;
		} catch {}
	}
	return null;
}

async function backfillForMovie(
	movieId: number,
	movieRepo: MovieRepository,
	episodeRepo: EpisodeRepository,
	external: ExternalAPIService,
	map: Map<number, string>,
	dryRun: boolean
): Promise<{ updated: number; totalMissing: number; note?: string }> {
	const movie = await movieRepo.findById(movieId);
	if (!movie) return { updated: 0, totalMissing: 0, note: 'movie-not-found' };

	const episodes = await episodeRepo.findByMovieId(movieId);
	const missing = episodes.filter(e => !e.episode_url || (e.episode_url + '').trim() === '');
	if (missing.length === 0) return { updated: 0, totalMissing: 0, note: 'no-missing' };

	let slug = map.get(movieId) || movie.slug;
	if (!slug) return { updated: 0, totalMissing: missing.length, note: 'no-slug' };

	let phimResp;
	try {
		phimResp = await external.getMovieBySlug(slug);
	} catch (e) {
		// Try search by title/year to find alternative slug
		const alt = await findAlternativeSlug(movie, external);
		if (!alt) return { updated: 0, totalMissing: missing.length, note: 'provider-miss' };
		try {
			phimResp = await external.getMovieBySlug(alt);
			slug = alt;
		} catch {
			return { updated: 0, totalMissing: missing.length, note: 'provider-miss' };
		}
	}

	let server = pickPreferredServer(phimResp.episodes);
	if (!server) {
		// No server with current slug, try search for alternative slug
		const alt = await findAlternativeSlug(movie, external);
		if (alt && alt !== slug) {
			try {
				const altResp = await external.getMovieBySlug(alt);
				const altServer = pickPreferredServer(altResp.episodes);
				if (altServer) {
					server = altServer;
					slug = alt;
				}
			} catch {}
		}
	}
	if (!server) return { updated: 0, totalMissing: missing.length, note: 'no-server' };

	let updated = 0;
	for (const ep of missing) {
		const idx = Math.max(0, (ep.episode_number || 1) - 1);
		const data = server.server_data[idx];
		const url = data?.link_m3u8 || data?.link_embed;
		if (!isValidUrl(url)) continue;
		if (dryRun) {
			updated++;
			continue;
		}
		await episodeRepo.update(ep.id, { episode_url: url });
		updated++;
	}

	// Save map for this movie if succeeded partially
	map.set(movieId, slug);
	return { updated, totalMissing: missing.length };
}

async function main() {
	const opts = parseArgs();
	console.log(`▶ Backfill episode_url: limit=${opts.limit} dryRun=${opts.dryRun} movieId=${opts.movieId ?? '-'}\n`);

	const db = Database.getInstance();
	await db.connect();
	const movieRepo = new MovieRepository();
	const episodeRepo = new EpisodeRepository();
	const external = new ExternalAPIService();
	const map = loadMap();

	const movieIds = await selectMoviesWithMissingEpisodeUrls(opts.limit, opts.movieId);
	if (movieIds.length === 0) {
		console.log('Nothing to update.');
		await db.disconnect();
		return;
	}

	let totalUpdated = 0;
	let totalMissing = 0;
	const results: Array<{ movieId: number; updated: number; missing: number; note?: string }> = [];

	for (const id of movieIds) {
		try {
			const res = await backfillForMovie(id, movieRepo, episodeRepo, external, map, opts.dryRun);
			results.push({ movieId: id, updated: res.updated, missing: res.totalMissing, note: res.note });
			totalUpdated += res.updated;
			totalMissing += res.totalMissing;
			console.log(`Movie ${id}: updated=${res.updated}/${res.totalMissing}${res.note ? ' note=' + res.note : ''}`);
		} catch (e: any) {
			console.error(`Movie ${id} failed:`, e?.message || e);
			results.push({ movieId: id, updated: 0, missing: 0, note: 'error' });
		}
	}

	if (!opts.dryRun) saveMap(map);

	console.log('\nSummary:');
	console.table(results);
	console.log(`Total updated=${totalUpdated} of missing=${totalMissing}`);

	await db.disconnect();
}

main().catch(async (err) => {
	console.error('Fatal error:', err);
	try { await Database.getInstance().disconnect(); } catch {}
	process.exit(1);
});
