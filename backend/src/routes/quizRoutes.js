import express from 'express';
import { recommendQuizDistro } from '../controllers/quizController.js';

const router = express.Router();

// Public — the "Find Your Distro" quiz is for every visitor (no login needed).
router.post('/recommend', recommendQuizDistro);

export default router;
