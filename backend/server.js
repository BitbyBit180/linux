import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import { notFound, errorHandler } from './src/middleware/errorMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Linux Hub API is running', time: new Date().toISOString() });
});

// NOTE: feature routes (/api/flavours, /api/distros) land in follow-up commits.

// 404 + error handler (must be last)
app.use(notFound);
app.use(errorHandler);

// Connect DB then listen
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});
