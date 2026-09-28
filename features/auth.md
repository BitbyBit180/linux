# Feature: Auth (Login / Register / Password Reset)

**What:** JWT auth guarding chat + community. Register/login → token 7d. Forgot → 6-digit OTP email (15 min, hashed) → verify → reset.
**Route:** `/login` (also embedded guard on `/chat`). **API:** `POST /api/auth/register|login|forgot-password|verify-reset-token|reset-password`, `GET /api/auth/me`.

## User flow
1. `AuthPage` tabs login/register; `useAuth` stores `dp_token` + `dp_user` in localStorage.
2. `ChatPage`/`communityApi` attach `Authorization: Bearer <token>`; `protect` middleware loads `req.user`.
3. Forgot: enter email → always-generic 200 (no enumeration) → 6-box OTP → new password.
4. Logout clears storage; `me()` never throws (returns null → guard shows login).

## Code chain
```
AuthPage.jsx → hooks/useAuth.js (listener-synced {user,token,login,register,logout})
  → services/authApi.js:48  request() adds Bearer, throws Error(message)
  → controllers/authController.js:19  bcrypt.hash(10) / bcrypt.compare,
      jwt.sign({id}, JWT_SECRET, 7d), OTP = crypto.randomInt + sha256 + expiry
  → middleware/authMiddleware.js:6  protect: verify JWT → User.findById → req.user
  → utils/mailer.js  SMTP if configured else console (refuses in prod without SMTP)
```

Key snippets:
```js
// authController.js — same error either way (no account enumeration)
if (!user) badCreds();  // 'Invalid email or password'
// forgot-password — always generic
res.json({ success: true, message: 'If an account exists...' });
```

## Files involved
- Frontend: `src/pages/AuthPage.jsx` (`OtpInput`, `ForgotResetView`, themed Google button), `src/hooks/useAuth.js`, `src/services/authApi.js` (`GOOGLE_CLIENT_ID` flag).
- Backend: `src/routes/authRoutes.js` (all with `authLimiter`), `src/controllers/authController.js`, `src/models/User.js` (`passwordHash` nullable, `googleId` unique+sparse, hides secrets), `src/middleware/authMiddleware.js` (`protect`, `requireAdmin`), `src/utils/mailer.js`.

## Sign in with Google (One Tap, no popup window)
- Themed "Continue with Google" button (hidden without `VITE_GOOGLE_CLIENT_ID`) opens Google's inline account chooser (`google.accounts.id.prompt`); the ID token goes straight to `POST /api/auth/google { credential }`.
- Backend verifies via `tokeninfo` (audience, `email_verified`, expiry) and links **by verified email**: same email = same account (password keeps working); new email = passwordless account. No client secret needed anywhere.
- Setup: `GOOGLE_CLIENT_ID` in `backend/.env` + `VITE_GOOGLE_CLIENT_ID` in frontend env (rebuild); origin in Google Console → Authorized JavaScript origins.

## How to demo / viva line
"Passwords are bcrypt-hashed, tokens are JWT 7d, reset codes are hashed OTPs with constant-time compare." Open `backend/src/controllers/authController.js:42` and `backend/src/middleware/authMiddleware.js:6`.
