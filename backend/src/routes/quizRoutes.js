import express from 'express';
import { recommendQuizDistro } from '../controllers/quizController.js';
import { quizLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// Public — the "Find Your Distro" quiz is for every visitor (no login needed).
// Rate-limited per IP: each hit can spend Jev tokens.
router.post('/recommend', quizLimiter, recommendQuizDistro);

export default router;
