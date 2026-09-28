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
// Starts a password signup: validates, stores/updates the account with
// emailVerified:false, and emails a 6-digit OTP. Returns NO token — the
// client must call verify-registration with the code. Re-calling with an
// unverified email re-sends a fresh code (resend path).
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
  const existing = await User.findOne({ email: emailNorm });
  // Verified (or legacy grandfathered) accounts keep their 409 — only
  // explicitly-unverified signups may re-send a code.
  if (existing && existing.emailVerified !== false) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = newOtp();
  const user = existing || new User({ email: emailNorm });
  user.name = name.trim() || user.name;
  user.passwordHash = passwordHash;
  user.emailVerified = false;
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpiry = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  try {
    await deliverResetToken({ email: emailNorm, token: otp });
  } catch (err) {
    // Don't strand the signup on mail failure — the code can be re-sent.
    res.status(503);
    throw new Error(err.message || 'Could not send the verification code. Please try again.');
  }

  res.status(201).json({
    success: true,
    message: 'Verification code sent — enter the 6-digit code from the email.',
    data: { email: emailNorm },
  });
});

// POST /api/auth/verify-registration { email, token } — checks the signup
// OTP and, on success, marks the email verified and signs the user in
// (returns { token, data: user } like login).
export const verifyRegistration = asyncHandler(async (req, res) => {
  const emailNorm = String(req.body?.email || '').trim().toLowerCase();
  const token = String(req.body?.token || '').trim();
  if (!EMAIL_RE.test(emailNorm) || !/^\d{6}$/.test(token)) {
    res.status(400);
    throw new Error('A valid email and the 6-digit code are required');
  }
  const hash = hashOtp(token);
  const user = await User.findOne({
    email: emailNorm,
    emailOtpHash: hash,
    emailOtpExpiry: { $gt: new Date() },
  });
  if (!user || !crypto.timingSafeEqual(Buffer.from(user.emailOtpHash), Buffer.from(hash))) {
    res.status(400);
    throw new Error('Code is incorrect or expired');
  }
  user.emailVerified = true;
  user.emailOtpHash = null;
  user.emailOtpExpiry = null;
  await user.save();
  respondWithToken(user, res);
});

// POST /api/auth/resend-verification { email } — re-sends the signup OTP
// for explicitly-unverified accounts. Always 200 with a generic message
// (no account enumeration).
export const resendVerification = asyncHandler(async (req, res) => {
  const emailNorm = String(req.body?.email || '').trim().toLowerCase();
  const generic = 'If that email is waiting for verification, a new code is on its way.';
  if (EMAIL_RE.test(emailNorm)) {
    const user = await User.findOne({ email: emailNorm });
    if (user && user.emailVerified === false && user.passwordHash) {
      const otp = newOtp();
      user.emailOtpHash = hashOtp(otp);
      user.emailOtpExpiry = new Date(Date.now() + RESET_TTL_MS);
      await user.save();
      try {
        await deliverResetToken({ email: emailNorm, token: otp });
      } catch {
        /* generic response either way */
      }
    }
  }
  res.json({ success: true, message: generic });
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
  if (!user || !user.passwordHash) badCreds();

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) badCreds();

  // Explicitly-unverified signups must finish the OTP step first.
  // (Legacy accounts without the field are grandfathered in.)
  if (user.emailVerified === false) {
    res.status(403);
    const err = new Error('Please verify your email — enter the 6-digit code we sent.');
    err.code = 'EMAIL_NOT_VERIFIED';
    throw err;
  }

  respondWithToken(user, res);
});

// GET /api/auth/me (protected)
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

const RESET_TTL_MS = 15 * 60 * 1000;

// 6-digit numeric OTP. Single-use, 15-min expiry, hashed at rest, and the
// auth limiter caps guessing at 30 attempts / 15 min per IP.
const newOtp = () => String(crypto.randomInt(100000, 1000000));
const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

// POST /api/auth/forgot-password { email } — always 200 with a generic
// message (no account enumeration). When the account exists, stores a
// hashed token and delivers the raw token via the mailer hook.
export const forgotPassword = asyncHandler(async (req, res) => {
  const emailNorm = String(req.body?.email || '').trim().toLowerCase();
  const generic = 'If an account exists for that email, a reset token is on its way.';
  if (EMAIL_RE.test(emailNorm)) {
    const user = await User.findOne({ email: emailNorm });
    if (user) {
      const otp = newOtp();
      user.resetTokenHash = hashOtp(otp);
      user.resetTokenExpiry = new Date(Date.now() + RESET_TTL_MS);
      await user.save();
      try {
        await deliverResetToken({ email: emailNorm, token: otp });
      } catch (err) {
        user.resetTokenHash = null;
        user.resetTokenExpiry = null;
        await user.save();
        res.status(503);
        throw new Error(err.message || 'Could not send the reset code. Please try again.');
      }
    }
  }
  res.json({ success: true, message: generic });
});

// POST /api/auth/verify-reset-token { token } — checks the 6-digit code
// without consuming it, so the UI can reveal the password fields only
// after a correct OTP.
export const verifyResetToken = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || '').trim();
  if (!/^\d{6}$/.test(token)) {
    res.status(400);
    throw new Error('Enter the 6-digit code from the email');
  }
  const hash = hashOtp(token);
  const user = await User.findOne({
    resetTokenHash: hash,
    resetTokenExpiry: { $gt: new Date() },
  });
  if (!user || !crypto.timingSafeEqual(Buffer.from(user.resetTokenHash), Buffer.from(hash))) {
    res.status(400);
    throw new Error('Code is incorrect or expired');
  }
  res.json({ success: true, message: 'Code verified — choose a new password.' });
});

// POST /api/auth/google { credential?, code? } — Sign in with Google.
// Two client flows land here:
// - { credential }: a Google ID token (verified directly), or
// - { code }: an OAuth authorization code from the GIS popup flow, exchanged
//   server-side for tokens (needs GOOGLE_CLIENT_SECRET).
// Either way the ID token is verified (audience, expiry, email_verified),
// then find-or-link-or-create by verified email:
// - googleId match → straight login
// - email match on a password account → LINK: attach googleId, mark the
//   email verified (Google proved ownership), keep the password working
// - unknown email → create a Google-only account (no passwordHash)
// Always responds like login: { success, token, data: user }.
export const googleAuth = asyncHandler(async (req, res) => {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  if (!clientId) {
    res.status(503);
    throw new Error('Google sign-in is not configured. Add GOOGLE_CLIENT_ID to backend/.env');
  }
  const credential = String(req.body?.credential || '').trim();
  const code = String(req.body?.code || '').trim();
  if (!credential && !code) {
    res.status(400);
    throw new Error('Google credential or authorization code is required');
  }

  // Popup flow: trade the one-time code for tokens (server-side only —
  // the secret never leaves the backend).
  let idToken = credential;
  if (!idToken) {
    const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
    if (!clientSecret) {
      res.status(503);
      throw new Error('Google sign-in is not configured. Add GOOGLE_CLIENT_SECRET to backend/.env');
    }
    try {
      const r = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (!r.ok) throw new Error('exchange rejected');
      const tokens = await r.json();
      if (!tokens.id_token) throw new Error('no id_token');
      idToken = String(tokens.id_token);
    } catch {
      res.status(401);
      throw new Error('Google verification failed. Please try again.');
    }
  }

  let claims;
  try {
    const r = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!r.ok) throw new Error('tokeninfo rejected');
    claims = await r.json();
  } catch {
    res.status(401);
    throw new Error('Google verification failed. Please try again.');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (
    claims.aud !== clientId ||
    claims.email_verified !== 'true' ||
    Number(claims.exp) < nowSec ||
    !claims.email ||
    !claims.sub
  ) {
    res.status(401);
    throw new Error('Google account could not be verified.');
  }

  const emailNorm = String(claims.email).toLowerCase();
  let user =
    (await User.findOne({ googleId: claims.sub })) ||
    (await User.findOne({ email: emailNorm }));
  if (user) {
    user.googleId = user.googleId || claims.sub;
    if (!user.name && claims.name) user.name = String(claims.name).slice(0, 80);
    user.emailVerified = true;
    await user.save();
  } else {
    try {
      user = await User.create({
        email: emailNorm,
        name: String(claims.name || '').slice(0, 80),
        googleId: claims.sub,
        emailVerified: true,
      });
    } catch (err) {
      // Parallel first-logins for the same email: link the winner's doc.
      if (err?.code !== 11000) throw err;
      user = await User.findOne({ email: emailNorm });
      if (!user) throw err;
      user.googleId = user.googleId || claims.sub;
      user.emailVerified = true;
      await user.save();
    }
  }
  respondWithToken(user, res);
});

// POST /api/auth/reset-password { token, password } — verifies the code
// (constant-time compare on hashes + expiry) and sets the new password.
export const resetPassword = asyncHandler(async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const password = req.body?.password || '';
  if (!/^\d{6}$/.test(token) || password.length < 6) {
    res.status(400);
    throw new Error('A 6-digit code and a 6+ character password are required');
  }
  const hash = hashOtp(token);
  const user = await User.findOne({
    resetTokenHash: hash,
    resetTokenExpiry: { $gt: new Date() },
  });
  if (!user || !crypto.timingSafeEqual(Buffer.from(user.resetTokenHash), Buffer.from(hash))) {
    res.status(400);
    throw new Error('Code is incorrect or expired');
  }
  user.passwordHash = await bcrypt.hash(password, 10);
  user.resetTokenHash = null;
  user.resetTokenExpiry = null;
  await user.save();
  res.json({ success: true, message: 'Password updated — please sign in.' });
});
