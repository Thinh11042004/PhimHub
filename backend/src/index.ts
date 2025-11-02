import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
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
import episodesRoutes from './routes/episodes.routes';
import { adminMovieGenresRouter } from './routes/admin.movie.genres';
import { errorHandler } from './middlewares/error.middleware';
import Database from './config/database';
import Migrator from './db/migrator';
import axios from 'axios';
import https from 'https';
import http from 'http';

// Load environment variables from backend/.env
// When running from src/: __dirname = .../backend/src, so ../.env is correct
// When running from dist/: __dirname = .../backend/dist, so ../.env is correct
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath });
console.log('📁 Loading .env from:', envPath);

// Note: Removed process.env.TZ to avoid timezone conflicts with UTC handling
// Backend now uses UTC consistently, frontend handles Vietnam timezone display

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - Disable helmet for development to avoid CORS issues
// app.use(helmet({
//   crossOriginResourcePolicy: { policy: "cross-origin" },
//   crossOriginEmbedderPolicy: false
// }));
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173', 
    'http://127.0.0.1:5174', 
    'http://127.0.0.1:3000',
    /^https:\/\/.*\.asse\.devtunnels\.ms$/,
    /^https:\/\/.*\.devtunnels\.ms$/
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));

// Set charset to UTF-8 for all responses
app.use((req, res, next) => {
  res.charset = 'utf-8';
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple media proxy to bypass CORS and cert issues (dev use)
app.get('/api/proxy', async (req, res) => {
  try {
    const target = (req.query.url as string) || '';
    if (!target || !/^https?:\/\//i.test(target)) {
      console.error('❌ Proxy: Invalid URL:', target);
      res.status(400).json({ error: 'invalid_url' });
      return;
    }

    const targetOrigin = (() => {
      try { return new URL(target).origin; } catch { return undefined; }
    })();

    // Allow cross-origin
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Range, Accept, Origin, Referer, User-Agent');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');

    // Set cache headers for images
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(target);
    if (isImage) {
      res.header('Cache-Control', 'public, max-age=86400'); // Cache images for 1 day
    }

    // Forward Range if present
    const range = req.headers['range'] as string | undefined;

    // Create HTTPS agent that doesn't reject unauthorized certificates
    // This fixes SSL certificate issues (ERR_CERT_AUTHORITY_INVALID)
    const agent = new https.Agent({ 
      rejectUnauthorized: false // Allow self-signed or invalid SSL certificates
    });

    const acceptHeader = isImage 
      ? 'image/*,*/*;q=0.8'
      : 'application/vnd.apple.mpegurl,application/x-mpegURL,video/*;q=0.9,*/*;q=0.8';

    console.log(`🔍 Proxy: Fetching ${isImage ? 'image' : 'media'} from:`, target);

    const upstream = await axios.get(target, {
      responseType: 'stream',
      headers: {
        ...(range ? { Range: range } : {}),
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36',
        Referer: targetOrigin || (req.headers['referer'] as string) || undefined,
        Origin: targetOrigin || undefined,
        Accept: acceptHeader,
        Connection: 'keep-alive'
      },
      httpsAgent: agent,
      httpAgent: new http.Agent({ keepAlive: true }),
      timeout: 30000, // Increased timeout for images
      maxRedirects: 5,
      validateStatus: () => true // Accept all status codes, we'll handle them
    });

    // Check if upstream returned an error status
    if (upstream.status >= 400) {
      console.error(`❌ Proxy: Upstream returned ${upstream.status} for:`, target);
      // Drain the error stream to prevent memory leaks
      upstream.data.resume(); // Consume the stream without processing
      upstream.data.on('error', () => {}); // Ignore drain errors
      
      if (!res.headersSent) {
        res.status(502).json({ 
          error: 'proxy_upstream_failed', 
          message: `Upstream server returned ${upstream.status}`,
          target: target
        });
      }
      return;
    }

    // Mirror important headers
    const passthroughHeaders = ['content-type', 'content-length', 'accept-ranges', 'content-range', 'cache-control'];
    for (const h of passthroughHeaders) {
      const v = upstream.headers[h];
      if (v) res.setHeader(h, v as any);
    }

    // Status passthrough (e.g., 206 for ranged, 200 for success)
    res.status(upstream.status);

    // Handle stream errors gracefully
    upstream.data.on('error', (err: any) => {
      console.error('❌ Proxy stream error:', err.message);
      try { 
        if (!res.headersSent) {
          res.status(502).json({ error: 'proxy_stream_failed', message: err.message });
        }
        res.destroy(); 
      } catch {}
    });

    upstream.data.pipe(res);
    console.log(`✅ Proxy: Successfully proxying ${upstream.status} response`);
    return;
  } catch (err: any) {
    console.error('❌ Proxy error:', err.message);
    console.error('❌ Proxy error stack:', err.stack);
    if (!res.headersSent) {
      res.status(502).json({ error: 'proxy_failed', message: err.message });
    }
    return;
  }
});

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
app.use('/api/episodes', episodesRoutes);
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
      '/api/genres'
    ]
  });
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
    // Connect to database
    const db = Database.getInstance();
    await db.connect();
    
    // Test database connection
    const isConnected = await db.testConnection();
    if (!isConnected) {
      throw new Error('Database connection test failed');
    }
    
    // Run migrations
    const migrator = new Migrator();
    await migrator.run();
    
    // Verify email configuration (optional, won't fail if not configured)
    const EmailService = (await import('./services/email.service')).EmailService;
    const emailConfigured = process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS;
    if (emailConfigured) {
      console.log('📧 Email service: Configured');
      console.log(`   Host: ${process.env.EMAIL_HOST}`);
      console.log(`   Port: ${process.env.EMAIL_PORT || '587'}`);
      console.log(`   User: ${process.env.EMAIL_USER?.substring(0, 3)}***`);
      try {
        const emailVerified = await EmailService.verifyConnection();
        if (emailVerified) {
          console.log('✅ Email service: SMTP connection verified');
        } else {
          console.warn('⚠️  Email service: SMTP connection failed (emails may not work)');
          console.warn('💡 Run "npm run test:email" to debug email configuration');
        }
      } catch (error: any) {
        console.warn('⚠️  Email service: SMTP verification error:', error.message);
        console.warn('💡 Run "npm run test:email" to debug email configuration');
      }
    } else {
      console.log('⚠️  Email service: Not configured (password reset emails won\'t be sent)');
      console.log('💡 Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env file to enable');
    }
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 PhimHub API server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log(`🔗 API Health: http://localhost:${PORT}/api/health`);
      console.log(`🗄️  Database: Connected to SQL Server`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
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
