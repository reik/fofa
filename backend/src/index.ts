import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';

import routes from './routes';
import { runMigrations } from './utils/migrate';

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

// Body parsing
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Static file serving for uploads
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', env: process.env.NODE_ENV }));

// 404
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413
    : (err.message === 'Only image files are allowed' || err.message === 'Unsupported media type') ? 400
    : 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = parseInt(process.env.PORT || '4000');

async function start() {
  runMigrations();
  app.listen(PORT, () => console.log(`🚀 FoFa API running on http://localhost:${PORT}`));
}

start().catch(console.error);

export default app;
