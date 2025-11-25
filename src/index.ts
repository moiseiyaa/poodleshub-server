import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import puppiesRouter from './routes/puppies';
import applicationsRouter from './routes/applications';
import breedsRouter from './routes/breeds';
import reservationsRouter from './routes/reservations';
import adminRouter from './routes/admin';

const app = express();

const allowedOrigins = env.FRONTEND_URL.split(',').map((origin) => origin.trim());
if (env.NODE_ENV !== 'production') {
  ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'].forEach((origin) => {
    if (!allowedOrigins.includes(origin)) {
      allowedOrigins.push(origin);
    }
  });
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
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
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});
