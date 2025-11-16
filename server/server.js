import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from parent directory's .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;

console.log('✅ server.js started');
console.log('Environment:', process.env.NODE_ENV);
console.log('PORT:', PORT);
console.log('Azure PORT override:', process.env.PORT);
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);


// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: [
        "'self'", 
        "https://api.openweathermap.org", 
        "https://api-inference.huggingface.co",
        "https://services3.arcgis.com",
        "https://services1.arcgis.com",
        "https://services.arcgis.com",
        "https://api.weather.gov",
        "https://raw.githubusercontent.com",
        "https://ewfw-hugafhdag5emcjgy.westus2-01.azurewebsites.net"
      ]
    }
  }
}));

// Rate limiting - more permissive for Cosmos DB and community features
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000, // Default 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5000'), // Increased limit for Cosmos DB operations
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === '/health') return true;
    
    // Skip rate limiting for static assets
    if (req.path.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      return true;
    }
    
    // Skip rate limiting for assets folder
    if (req.path.startsWith('/assets/') || req.path.startsWith('/icons/')) {
      return true;
    }
    
    // More lenient for community and family endpoints
    if (req.path.startsWith('/api/community') || req.path.startsWith('/api/family-groups')) {
      return true; // Skip rate limiting for Cosmos DB endpoints
    }
    
    // Skip rate limiting for notification endpoints in development
    if (process.env.NODE_ENV !== 'production' && req.path.startsWith('/api/notifications')) {
      return true;
    }
    
    // More permissive in development
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    
    return false;
  }
});

console.log(`🔒 Rate limiting: ${parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '2000')} requests per ${parseInt(process.env.RATE_LIMIT_WINDOW || '15')} minutes`);

app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://ecoquest-wildfire-watch.vercel.app',
        'https://ecoquest-wildfire-watch-git-main-siddharth-shan.vercel.app',
        'https://ewfw-hugafhdag5emcjgy.westus2-01.azurewebsites.net',
        'https://fireguardian-ai.ecoquestfoundation.org',
        /\.ecoquestfoundation\.org$/  // Allow all subdomains
      ]
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));

// General middleware
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Handle common missing status code images to prevent 503 errors
app.get(/^\/(\d{3})\.png$/, (req, res) => {
  const statusCode = req.params[0];
  console.log(`📷 Request for status code image: ${statusCode}.png`);
  
  // Return a 204 No Content for missing status images instead of 503
  res.status(204).end();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API routes - UPGRADED to enhanced AI analysis
try {
  app.use('/api/ai-analysis', (await import('./routes/enhanced-ai-analysis.js')).default);
  app.use('/api/fire-data', (await import('./routes/fire-data.js')).default);
  app.use('/api/weather', (await import('./routes/weather.js')).default);
  app.use('/api/air-quality', (await import('./routes/air-quality.js')).default);
  app.use('/api/alerts', (await import('./routes/alerts.js')).default);
  app.use('/api/news', (await import('./routes/news.js')).default);
  app.use('/api/news/enhanced', (await import('./routes/enhancedNews.js')).default);
  app.use('/api/notifications', (await import('./routes/notifications.js')).default);
  app.use('/api/family-groups', (await import('./routes/family-groups-cosmos.js')).default);
  app.use('/api/community', (await import('./routes/community-cosmos-optimized.js')).default);
  console.log('✅ All API routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading API routes:', error);
  console.error('Error stack:', error.stack);
}

// Home page route
app.get('/api/meta', (req, res) => {
  res.json({
    name: 'EcoQuest Wildfire Watch API',
    version: '1.0.0',
    description: 'AI-powered wildfire detection and safety education API',
    status: 'online',
    endpoints: '/api'
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'EcoQuest Wildfire Watch API',
    version: '1.0.0',
    description: 'AI-powered wildfire detection and safety education API',
    endpoints: {
      'POST /api/ai-analysis/analyze': 'Analyze vegetation image for fire hazards',
      'GET /api/fire-data/nearby': 'Get nearby active fires',
      'GET /api/fire-data/:fireId': 'Get specific fire details',
      'GET /api/weather/current': 'Get current weather conditions',
      'GET /api/weather/forecast': 'Get weather forecast',
      'POST /api/community/report': 'Submit community fire hazard report',
      'GET /api/community/reports': 'Get community reports',
      'GET /api/news/fire-related': 'Get fire-related news and social content',
      'GET /api/news/sources': 'Get available news sources',
      'GET /api/news/enhanced/fire-related': 'Get enhanced California fire news from reliable sources',
      'GET /api/news/enhanced/breaking': 'Get breaking fire news and emergency alerts',
      'GET /api/news/enhanced/sources': 'Get enhanced news sources status',
      'POST /api/notifications/subscribe': 'Subscribe to push notifications',
      'POST /api/notifications/unsubscribe': 'Unsubscribe from push notifications',
      'POST /api/notifications/test': 'Send test notification',
      'POST /api/notifications/broadcast': 'Send notification to all subscribers',
      'GET /api/notifications/stats': 'Get subscription statistics',
      'GET /api/family-groups/health': 'Check family groups service health',
      'PUT /api/family-groups/:groupCode': 'Save family group data for cross-device access',
      'GET /api/family-groups/:groupCode': 'Load family group data from cloud storage',
      'DELETE /api/family-groups/:groupCode': 'Delete family group data',
      'GET /api/family-groups': 'List all family groups (admin/debug)'
    },
    documentation: 'See /docs for full API documentation'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }
  
  // Handle different error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication token'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Serve frontend build in production
if (process.env.NODE_ENV === 'production') {
  // Static files are in the root dist folder, not server/dist
  app.use(express.static(join(__dirname, '..', 'dist')));

  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
  });
}

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /health',
      'GET /api',
      'POST /api/ai-analysis/analyze',
      'GET /api/fire-data/nearby',
      'GET /api/weather/current',
      'GET /api/family-groups/health',
      'PUT /api/family-groups/:groupCode',
      'GET /api/family-groups/:groupCode'
    ]
  });
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Close server and cleanup
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`=% EcoQuest Server running on port ${PORT}`);
  console.log(`=� Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`< Health check: http://localhost:${PORT}/health`);
  console.log(`=� API docs: http://localhost:${PORT}/api`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`=' Frontend should be running on: http://localhost:5173`);
  }
});

export default app;