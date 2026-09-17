import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import connectDB from './src/config/db.js';
import distroRoutes from './src/routes/distroRoutes.js';
import flavourRoutes from './src/routes/flavourRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import communityRoutes from './src/routes/communityRoutes.js';
import quizRoutes from './src/routes/quizRoutes.js';
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

// API routes
// flavours -> lean catalogue for the Flavours page
// distros  -> full detail (specs + install guides) for the Detail page
app.use('/api/flavours', flavourRoutes);
app.use('/api/distros', distroRoutes);
// auth    -> register/login/me for the AI assistant
// chat    -> AI assistant conversations (all routes protected)
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
// community -> Reddit-style per-distro channels (posts/comments/votes, all protected)
app.use('/api/community', communityRoutes);
// quiz -> AI-powered "Find Your Distro" recommendation (public, rule-based fallback)
app.use('/api/quiz', quizRoutes);

// 404 + error handler (must be last)
app.use(notFound);
app.use(errorHandler);

// Connect DB then listen
connectDB().then(() => {
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
});

