import express from 'express';
import {
  register,
  verifyRegistration,
  resendVerification,
  login,
  googleAuth,
  getMe,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { rateLimit } from '../middleware/rateLimit.js';

// Brute-force brake on the credential + reset endpoints (per IP).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Too many auth attempts — please wait a few minutes.',
});

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/verify-registration', authLimiter, verifyRegistration);
router.post('/resend-verification', authLimiter, resendVerification);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-reset-token', authLimiter, verifyResetToken);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', protect, getMe);

export default router;
