import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import puppiesRouter from './routes/puppies.js';
import applicationsRouter from './routes/applications.js';
import breedsRouter from './routes/breeds.js';
import reservationsRouter from './routes/reservations.js';
import adminRouter from './routes/admin.js';

const app = express();

const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Log all origins for debugging
    console.log(`CORS request from origin: ${origin}`);
    console.log(`Allowed origins: ${JSON.stringify(allowedOrigins)}`);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked CORS origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
      admin: '/api/admin'
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
