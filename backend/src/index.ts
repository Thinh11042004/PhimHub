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
import { adminMovieGenresRouter } from './routes/admin.movie.genres';
import { errorHandler } from './middlewares/error.middleware';
import Database from './config/database';
import Migrator from './db/migrator';

// Load environment variables
dotenv.config();

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
