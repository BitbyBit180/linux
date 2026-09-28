# Feature: Auth (Login / Register OTP / Google)

**What:** JWT auth guarding chat + community. Password signup is **two-step
with OTP**; **Sign in with Google** links by verified email. Forgot-password
OTP unchanged.
**Route:** `/login` (also embedded guard on `/chat`). **API:** `/api/auth/*`.

## Password signup (OTP-gated)
1. `AuthPage` (Create account) → `register()` sends name/email/password →
   backend stores the account with `emailVerified:false` + 6-digit OTP
   (sha256, 15 min) and emails the code. **No token is returned.**
2. UI switches to the verify view (`OtpInput`, resend link) →
   `verifyRegistration(email, otp)` → verified + signed straight in.
3. Re-registering an unverified email re-sends a fresh code (and updates
   name/password); verified emails keep the 409.
4. `login` refuses explicitly-unverified accounts with 403
   `EMAIL_NOT_VERIFIED` → the UI auto-resends and jumps to the OTP view.
   Legacy accounts (no `emailVerified` field) are grandfathered in.

## Sign in with Google
1. Themed "Continue with Google" button (official G, mono pill; hidden when
   `VITE_GOOGLE_CLIENT_ID` is unset) → opens Google's real sign-in page in a
   **separate popup window** (GIS OAuth code flow, `ux_mode: 'popup'`)
   → one-time code → `POST /api/auth/google { code }`.
2. Backend exchanges the code server-side (secret never leaves the server),
   verifies the ID token via Google `tokeninfo` (audience = `GOOGLE_CLIENT_ID`,
   `email_verified`, expiry) — plain fetch, no SDK.
3. **Merge rule (same email = same account):**
   - `googleId` match → login.
   - Email match on a password account → **LINK**: attach `googleId`, mark
     `emailVerified:true` (Google proved ownership), **password keeps
     working**. One account, two login methods.
   - Unknown email → new Google-only account (`passwordHash:null`,
     `emailVerified:true`).
   - Parallel first-logins race on the unique index → loser links the
     winner's doc (409 retry path).
4. Always responds like login: `{ token, data: user }` — chat/community code
   is untouched.

## Password reset (unchanged)
Forgot → generic 200 → 6-box OTP (`verify-reset-token`) → new password
(`reset-password`). OTP fields are separate from registration OTPs so both
flows coexist.

## Code chain
```
AuthPage.jsx (auth | verify-signup | forgot | reset views + GIS button)
  → hooks/useAuth.js (register sends OTP; verifyRegistration/googleLogin sign in)
  → services/authApi.js (err.code passthrough, GOOGLE_CLIENT_ID flag)
  → controllers/authController.js (register/verifyRegistration/
      resendVerification/login+gate/googleAuth + link logic)
  → models/User.js (googleId unique+sparse, emailVerified, emailOtpHash/Expiry,
      nullable passwordHash; googleId + OTP hashes hidden from JSON)
  → middleware/errorMiddleware.js (string err.code passes through as `code`)
```

## Files involved
- Frontend: `src/pages/AuthPage.jsx`, `src/hooks/useAuth.js`,
  `src/services/authApi.js`, `frontend/.env.example`
  (`VITE_GOOGLE_CLIENT_ID`).
- Backend: `src/routes/authRoutes.js` (all under `authLimiter`),
  `src/controllers/authController.js`, `src/models/User.js`,
  `src/middleware/errorMiddleware.js`, `.env.example` (`GOOGLE_CLIENT_ID`).

## Setup for demo
1. Google Cloud Console → APIs & Services → Credentials → OAuth client ID
   (Web) → authorized origin `http://localhost:5173` (+ production URL).
2. `backend/.env`: `GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com`;
   `frontend/.env`: `VITE_GOOGLE_CLIENT_ID=` same value. Rebuild frontend.
3. Dev OTPs print in the backend console when SMTP is unset
   (`RESET_DELIVERY=console`); production needs SMTP or codes never arrive.

## How to demo / viva line
"Signup proves email ownership before any token exists; Google sign-in
links by verified email so one address is always one account." Open
`backend/src/controllers/authController.js:223` (googleAuth) and
`frontend/src/pages/AuthPage.jsx` (verify-signup view).
