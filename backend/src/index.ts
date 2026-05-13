import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import rateLimit from 'express-rate-limit';

import routes from './routes';
import { runMigrations } from './utils/migrate';

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({ origin: corsOrigin, credentials: true }));
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

// Temporary DB upload endpoint — remove after use
const dbUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
app.post('/admin/upload-db', dbUpload.single('db'), (req, res) => {
  const key = req.headers['x-admin-key'];
  if (!key || key !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  const dbPath = process.env.DB_PATH || './fofa.db';
  const backup = `${dbPath}.bak`;
  if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, backup);
  fs.writeFileSync(dbPath, req.file.buffer);
  res.json({ message: 'Database replaced. Restart the service to pick up changes.' });
});

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
