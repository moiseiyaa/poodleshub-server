import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import puppiesRouter from './routes/puppies';
import applicationsRouter from './routes/applications';
import breedsRouter from './routes/breeds';
import reservationsRouter from './routes/reservations';

const app = express();

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
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
