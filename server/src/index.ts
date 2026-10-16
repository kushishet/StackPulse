import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { db } from './db/database.js';
import authRoutes from './routes/authRoutes.js';
import developerRoutes from './routes/developerRoutes.js';
import compareRoutes from './routes/compareRoutes.js';
import pinRoutes from './routes/pinRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'StackPulse API',
    timestamp: new Date().toISOString(),
    isPostgres: db.isPostgres(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/pins', pinRoutes);

// Serve static frontend files if client/dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
}

// Global error handler
app.use(errorHandler);

// Bootstrap
async function startServer() {
  try {
    await db.initialize();
    app.listen(config.port, () => {
      console.log(`\n=================================================`);
      console.log(`🚀 StackPulse Backend running on http://localhost:${config.port}`);
      console.log(`   Database Mode: ${db.isPostgres() ? 'PostgreSQL (Connected)' : 'Local Resilient Store'}`);
      console.log(`   GitHub Token: ${config.githubToken ? 'Configured (5,000 req/hr)' : 'Unauthenticated (60 req/hr)'}`);
      console.log(`=================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start StackPulse server:', err);
    process.exit(1);
  }
}

startServer();
