import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { isDbConnected } from './config/db.js';
import boardRoutes from './routes/boardRoutes.js';
import objectRoutes from './routes/objectRoutes.js';
import revisionRoutes from './routes/revisionRoutes.js';
import shareRoutes from './routes/shareRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import { ShareController } from './controllers/shareController.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors({
  origin: true, // Dynamically allows requests from localhost:5173, 10.53.80.40:5173, etc.
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PixelForge Backend',
    timestamp: new Date().toISOString(),
    databaseConnected: isDbConnected(),
  });
});

// Mount modular REST routes
app.use('/api/boards', boardRoutes);
app.use('/api/boards/:boardId/objects', objectRoutes);
app.use('/api/boards/:boardId/revisions', revisionRoutes);
app.use('/api/boards/:id/assets', assetRoutes);
app.post('/api/boards/:id/share', ShareController.createShareLink);
app.use('/api/share', shareRoutes);

// Catch-all & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
