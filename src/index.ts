import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { analyticsMiddleware } from './middleware/analytics.js';
import puppiesRouter from './routes/puppies.js';
import applicationsRouter from './routes/applications.js';
import breedsRouter from './routes/breeds.js';
import reservationsRouter from './routes/reservations.js';
import adminRouter from './routes/admin.js';
import testimonialsRouter from './routes/testimonials.js';
import reviewsRouter from './routes/reviews.js';
import analyticsRouter from './routes/analytics.js';
import exportRouter from './routes/export.js';
import seoRouter from './routes/seo.js';
import webVitalsRouter from './routes/webVitals.js';
import blogRouter from './routes/blog.js';
import uploadRouter from './routes/upload.js';
import path from 'path';

const app = express();

const allowedOrigins: (string | RegExp)[] = [
  env.FRONTEND_URL,
  'https://puppyhubusa.com',
  'https://www.puppyhubusa.com',
  // Accept any sub-domain like staging.puppyhubusa.com, blog.puppyhubusa.com, etc.
  /^https?:\/\/([a-z0-9-]+\.)*puppyhubusa\.com$/,
  // Allow Vercel preview deployments
  /^https?:\/\/([a-z0-9-]+)\.vercel\.app$/,
  'https://pup-client-2r9q7pri1-moise-iyas-projects.vercel.app',
  // Local development
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Middleware
app.use(cookieParser());
app.use(cors({
  origin: (origin, callback) => {
    // Log all origins for debugging
    console.log(`CORS request from origin: ${origin}`);
    console.log(`Allowed origins: ${JSON.stringify(allowedOrigins)}`);
    
    const isAllowed = !origin || allowedOrigins.some(o =>
      typeof o === "string" ? o === origin : o.test(origin as string)
    );
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  // Ensure preflight returns a friendly success status
  optionsSuccessStatus: 204,
  preflightContinue: false,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Explicit OPTIONS preflight handler to ensure Access-Control headers
// are returned even for requests that would otherwise be blocked.
app.options('*', (req, res) => {
  const origin = req.headers.origin as string | undefined;

  const isAllowed = !origin || allowedOrigins.some(o =>
      typeof o === "string" ? o === origin : o.test(origin as string)
    );
    if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(204);
  }

  return res.sendStatus(403);
});

// Analytics middleware - logs all requests (except skipped paths)
app.use(analyticsMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    name: 'PuppyHub USA API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      puppies: '/api/puppies',
      availablePuppies: '/api/puppies/status/available',
      applications: '/api/applications',
      breeds: '/api/breeds',
      reservations: '/api/reservations',
      admin: '/api/admin',
      seo: '/api/seo',
      blog: '/api/blog'
    },
    documentation: 'https://github.com/moiseiyaa/poodleshub-server'
  });
});

// Routes
app.use('/api/puppies', puppiesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/breeds', breedsRouter);
app.use('/api/reservations', reservationsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/export', exportRouter);
app.use('/api/admin/seo', seoRouter);
app.use('/api/seo', seoRouter);
app.use('/api/seo/web-vitals', webVitalsRouter);
app.use('/api/admin/blog', blogRouter);
app.use('/api/blog', blogRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('🔥 Server error:', err);
  console.error('Stack trace:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = env.PORT;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

// Handle port already in use error
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`\n💡 Solutions:`);
    console.error(`   1. Kill the process using port ${PORT}:`);
    console.error(`      Windows: netstat -ano | findstr :${PORT}`);
    console.error(`      Then: taskkill /PID <PID> /F`);
    console.error(`   2. Or change PORT in your .env file`);
    console.error(`   3. Or find and stop the other server instance\n`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});
