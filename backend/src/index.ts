import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import sql from 'mssql';
import authRoutes from './routes/auth.routes';
import tmdbRoutes from './routes/tmdb.routes';
import adminRoutes from './routes/admin.routes';
import moviesRoutes from './routes/movies.routes';
import interactionsRoutes from './routes/interactions.routes';
import watchHistoryRoutes from './routes/watchHistory.routes';
import genresRoutes from './routes/genres.routes';
import favoritesRoutes from './routes/favorites.routes';
import customListRoutes from './routes/customList.routes';
import actorsRoutes from './routes/actors.routes';
import directorsRoutes from './routes/directors.routes';
import commentsSseRoutes from './routes/comments-sse.routes';
import { adminMovieGenresRouter } from './routes/admin.movie.genres';
import { errorHandler } from './middlewares/error.middleware';
import Database from './config/database';
import Migrator from './db/migrator';
import { startKKPhimScheduler } from './jobs/kkphim-crawler';
import { crawlKKPhimOnce, getLastKKPhimCrawl } from './jobs/kkphim-crawler';
import { authenticateToken } from './middlewares/auth.middleware';
import { ensureAdmin } from './middlewares/admin.middleware';
import { DownloadQueueService } from './services/download-queue.service';
import { startMediaDownloadWorker } from './jobs/media-download-worker';

/**
 * HTTP API bootstrapper (composition root)
 * - Wires middleware, routes, and cross-cutting concerns
 * - No business logic here; delegates to controllers/services
 */
// Note: helmet is intentionally omitted during development to avoid CORS/embed issues

// Load environment variables
dotenv.config();
// Fallback to root .env when running inside backend folder
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

// Note: Removed process.env.TZ to avoid timezone conflicts with UTC handling
// Backend now uses UTC consistently, frontend handles Vietnam timezone display

const app = express();
const PORT = process.env.PORT || 3001;
let dbReady = false;

// Early health before heavy setup
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', ts: new Date().toISOString(), dbReady });
});

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:3000',
    // Added Docker-served frontend origins
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    /^https:\/\/.*\.asse\.devtunnels\.ms$/,
    /^https:\/\/.*\.devtunnels\.ms$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar', 'X-Search-Source', 'X-External-API']
}));

// Ensure custom headers are exposed for all responses (some proxies may strip CORS config)
app.use((req, res, next) => {
  const existing = (res.getHeader('Access-Control-Expose-Headers') as string) || '';
  const extras = 'Content-Length, X-Foo, X-Bar, X-Search-Source, X-External-API';
  res.setHeader('Access-Control-Expose-Headers', existing ? `${existing}, ${extras}` : extras);
  next();
});

// Middleware stack kept minimal; add security headers in production via reverse proxy or helmet

// Set charset to UTF-8 for all responses
app.use((req, res, next) => {
  res.charset = 'utf-8';
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads) with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/movies', moviesRoutes);
app.use('/api/tmdb', tmdbRoutes);
app.use('/api/interactions', interactionsRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.use('/', adminMovieGenresRouter);
app.use('/api/genres', genresRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/custom-lists', customListRoutes);
app.use('/api/actors', actorsRoutes);
app.use('/api/directors', directorsRoutes);
app.use('/api/sse', commentsSseRoutes);
// People selection routes with proper Unicode support and pagination
app.get('/api/people/selection', async (req, res) => {
  const role = (req.query.role as string) || 'actor';
  if (!['actor', 'director'].includes(role)) return res.status(400).json({ error: 'invalid_role' });

  const q = (req.query.q as string) || '';
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200); // Allow up to 200 per page
  const offset = parseInt(req.query.offset as string) || 0;

  const table = role === 'actor' ? 'actors' : 'directors';
  
  try {
    const db = Database.getInstance();
    const pool = db.getPool();
    
    // Use Vietnamese collation for proper Unicode search
    const where = q ? 'WHERE name COLLATE Vietnamese_CI_AI LIKE @q' : '';
    const orderBy = 'ORDER BY name COLLATE Vietnamese_CI_AI ASC';

    const countSql = `SELECT COUNT(1) AS total FROM dbo.${table} ${where};`;
    const dataSql = `
      SELECT id, name, photo_url, nationality
      FROM dbo.${table}
      ${where}
      ${orderBy}
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY;
    `;

    const countReq = pool.request();
    const dataReq = pool.request();
    if (q) { 
      countReq.input('q', sql.NVarChar, `%${q}%`); 
      dataReq.input('q', sql.NVarChar, `%${q}%`); 
    }
    dataReq.input('offset', sql.Int, offset).input('limit', sql.Int, limit);

    const [countRs, dataRs] = await Promise.all([countReq.query(countSql), dataReq.query(dataSql)]);
    const total = countRs.recordset?.[0]?.total ?? 0;
    const items = (dataRs.recordset || []).map((r: any) => ({
      id: r.id, 
      name: r.name, 
      avatar: r.photo_url || null, 
      nationality: r.nationality || null,
    }));

    return res.json({ items, total, role, q, limit, offset });
  } catch (error: any) {
    console.error('Database error:', error);
    // Fallback to mock data when database fails
    const mockData = role === 'actor' ? [
      { id: 1, name: 'Tom Hanks', avatar: null, nationality: 'American' },
      { id: 2, name: 'Leonardo DiCaprio', avatar: null, nationality: 'American' },
      { id: 3, name: 'Brad Pitt', avatar: null, nationality: 'American' },
      { id: 4, name: 'Johnny Depp', avatar: null, nationality: 'American' },
      { id: 5, name: 'Robert Downey Jr.', avatar: null, nationality: 'American' }
    ] : [
      { id: 1, name: 'Christopher Nolan', avatar: null, nationality: 'British' },
      { id: 2, name: 'Steven Spielberg', avatar: null, nationality: 'American' },
      { id: 3, name: 'Martin Scorsese', avatar: null, nationality: 'American' },
      { id: 4, name: 'Quentin Tarantino', avatar: null, nationality: 'American' },
      { id: 5, name: 'Ridley Scott', avatar: null, nationality: 'British' }
    ];
    
    const filteredData = q ? mockData.filter(person => 
      person.name.toLowerCase().includes(q.toLowerCase())
    ) : mockData;
    
    return res.json({ 
      items: filteredData.slice(offset, offset + limit), 
      total: filteredData.length, 
      role, 
      q, 
      limit, 
      offset 
    });
  }
});

// Backward compatibility routes
app.get('/api/actors/selection', async (req, res) => {
  req.query.role = 'actor';
  return app._router.handle(req, res);
});

app.get('/api/directors/selection', async (req, res) => {
  req.query.role = 'director';
  return app._router.handle(req, res);
});

app.get('/api/people/health', (_req, res) => {
  res.json({ 
    items: [
      { id: 1, name: 'Mock Actor', avatar: null, nationality: 'American' },
      { id: 2, name: 'Mock Director', avatar: null, nationality: 'British' }
    ], 
    total: 2 
  });
});

// Root route for testing
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PhimHub API is running',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/health',
      '/api/directors',
      '/api/actors', 
      '/api/movies',
      '/api/genres',
      '/jobs/kkphim/last',
      '/jobs/kkphim/run-once'
    ]
  });
});

// Jobs: KKPhim crawler quick endpoints (dev/admin)
app.get('/jobs/kkphim/last', authenticateToken, ensureAdmin, (_req, res) => {
  res.json(getLastKKPhimCrawl() || { status: 'no-run' });
});
app.post('/jobs/kkphim/run-once', authenticateToken, ensureAdmin, async (_req, res) => {
  try {
    const r = await crawlKKPhimOnce();
    res.json(r);
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Admin: job_runs listing
app.get('/jobs/runs', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { job_name, limit = '50', offset = '0' } = req.query as any;
    const db = Database.getInstance();
    const pool = db.getPool();
    let sqlText = `SELECT * FROM dbo.job_runs`;
    const where: string[] = [];
    if (job_name) where.push(`job_name = @job_name`);
    if (where.length) sqlText += ' WHERE ' + where.join(' AND ');
    sqlText += ' ORDER BY started_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    const reqDb = pool.request();
    if (job_name) reqDb.input('job_name', sql.NVarChar, String(job_name));
    reqDb.input('offset', sql.Int, parseInt(String(offset) || '0'));
    reqDb.input('limit', sql.Int, Math.min(parseInt(String(limit) || '50'), 200));
    const rs = await reqDb.query(sqlText);
    res.json({ items: rs.recordset });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Admin: media_downloads listing and retry
app.get('/jobs/media', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { status, kind, limit = '50', offset = '0' } = req.query as any;
    const db = Database.getInstance();
    const pool = db.getPool();
    let sqlText = `SELECT * FROM dbo.media_downloads`;
    const where: string[] = [];
    if (status) where.push(`status = @status`);
    if (kind) where.push(`kind = @kind`);
    if (where.length) sqlText += ' WHERE ' + where.join(' AND ');
    sqlText += ' ORDER BY created_at DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    const reqDb = pool.request();
    if (status) reqDb.input('status', sql.NVarChar, String(status));
    if (kind) reqDb.input('kind', sql.NVarChar, String(kind));
    reqDb.input('offset', sql.Int, parseInt(String(offset) || '0'));
    reqDb.input('limit', sql.Int, Math.min(parseInt(String(limit) || '50'), 200));
    const rs = await reqDb.query(sqlText);
    res.json({ items: rs.recordset });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

app.post('/jobs/media/retry/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'invalid id' });
    const db = Database.getInstance();
    const pool = db.getPool();
    await pool.request().input('id', sql.Int, id)
      .query("UPDATE dbo.media_downloads SET status='pending', last_error=NULL, updated_at = SYSUTCDATETIME() WHERE id=@id");
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
});

app.post('/jobs/media/process-one', authenticateToken, ensureAdmin, async (_req, res) => {
  try {
    const svc = new DownloadQueueService();
    const progressed = await svc.processOne();
    res.json({ progressed });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || String(e) });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'PhimHub API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Start server immediately to avoid proxy 502s
    app.listen(PORT, () => {
      console.log(`🚀 PhimHub API server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
    });

    // Initialize database + migrations + schedulers in background with retry
    (async () => {
      const db = Database.getInstance();
      const maxAttempts = parseInt(process.env.DB_INIT_MAX_ATTEMPTS || '30');
      const delayMs = parseInt(process.env.DB_INIT_DELAY_MS || '2000');
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          await db.connect();
          const ok = await db.testConnection();
          if (!ok) throw new Error('DB test failed');
          dbReady = true;
          console.log('✅ Database ready');
          break;
        } catch (e: any) {
          console.warn(`DB init attempt ${attempt}/${maxAttempts} failed:`, e?.message || e);
          await new Promise(r => setTimeout(r, delayMs));
        }
      }

      if (!dbReady) {
        console.error('⚠️  Database not ready after retries; server continues running');
        return;
      }

      // Run migrations (non-fatal)
      try {
        console.log('🔄 Starting database migrations (background)...');
        const migrator = new Migrator();
        await migrator.run();
        console.log('✅ Migrations finished');
      } catch (e: any) {
        console.error('⚠️  Migrations failed (continuing to serve):', e?.message || e);
      }

      // Start KKPhim hourly scheduler
      startKKPhimScheduler();

      // Start media download background worker
      startMediaDownloadWorker();
    })();
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    // Do not exit; keep server alive to avoid 502 from proxy
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  const db = Database.getInstance();
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  const db = Database.getInstance();
  await db.disconnect();
  process.exit(0);
});

startServer();
