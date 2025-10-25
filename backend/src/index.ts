import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
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
import { errorHandler } from './middlewares/error.middleware';
import Database from './config/database';
import Migrator from './db/migrator';

// Load environment variables
dotenv.config();

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
app.use('/api/genres', genresRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/custom-lists', customListRoutes);
app.use('/api/actors', actorsRoutes);
app.use('/api/directors', directorsRoutes);

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
