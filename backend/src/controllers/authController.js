import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { deliverResetToken } from '../utils/mailer.js';

// Shared response shape: { success, token, data: { id, email, name } }
const respondWithToken = (user, res) => {
  const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  res.json({ success: true, token, data: user });
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register { name?, email, password }
export const register = asyncHandler(async (req, res) => {
  const { name = '', email = '', password = '' } = req.body || {};

  if (!email.trim() || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }
  if (!EMAIL_RE.test(email.trim())) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }
  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const emailNorm = email.trim().toLowerCase();
  const exists = await User.findOne({ email: emailNorm });
  if (exists) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: emailNorm, passwordHash });

  res.status(201).json(respondWithToken(user, res));
});

// POST /api/auth/login { email, password }
export const login = asyncHandler(async (req, res) => {
  const { email = '', password = '' } = req.body || {};

  if (!email.trim() || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  // Same message for both cases — no account enumeration.
  const badCreds = () => {
    res.status(401);
    throw new Error('Invalid email or password');
  };
  if (!user) badCreds();

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) badCreds();

  respondWithToken(user, res);
});

// GET /api/auth/me (protected)
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

const RESET_TTL_MS = 15 * 60 * 1000;

// POST /api/auth/forgot-password { email } — always 200 with a generic
// message (no account enumeration). When the account exists, stores a
// hashed token and delivers the raw token via the mailer hook.
export const forgotPassword = asyncHandler(async (req, res) => {
  const emailNorm = String(req.body?.email || '').trim().toLowerCase();
  const generic = 'If an account exists for that email, a reset token is on its way.';
  if (EMAIL_RE.test(emailNorm)) {
    const user = await User.findOne({ email: emailNorm });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
      user.resetTokenExpiry = new Date(Date.now() + RESET_TTL_MS);
      await user.save();
      try {
        await deliverResetToken({ email: emailNorm, token });
      } catch (err) {
        user.resetTokenHash = null;
        user.resetTokenExpiry = null;
        await user.save();
        res.status(503);
        throw new Error(err.message || 'Could not send the reset token. Please try again.');
      }
    }
  }
  res.json({ success: true, message: generic });
});

// POST /api/auth/reset-password { token, password } — verifies the token
// (constant-time compare on hashes + expiry) and sets the new password.
export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const password = req.body?.password || '';
  if (!token || password.length < 6) {
    res.status(400);
    throw new Error('A valid token and a 6+ character password are required');
  }
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetTokenHash: hash,
    resetTokenExpiry: { $gt: new Date() },
  });
  if (!user || !crypto.timingSafeEqual(Buffer.from(user.resetTokenHash), Buffer.from(hash))) {
    res.status(400);
    throw new Error('Reset token is invalid or expired');
  }
  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetTokenHash = null;
  user.resetTokenExpiry = null;
  await user.save();
  res.json({ success: true, message: 'Password updated — please sign in.' });
});
