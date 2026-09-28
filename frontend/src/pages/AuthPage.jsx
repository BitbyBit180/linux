import React, { useState, useRef, useEffect } from 'react';
import { Bot, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { forgotPassword as apiForgot, resetPassword as apiReset, verifyResetToken as apiVerify, GOOGLE_CLIENT_ID } from '../services/authApi.js';
import { THEME, LINE, LINE_SOFT, MONO } from '../theme/designTokens.js';

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(22, 27, 34, 0.65)',
  border: `1px solid ${LINE}`,
  borderRadius: 10,
  padding: '10px 12px',
  fontFamily: MONO,
  fontSize: '0.85rem',
  color: THEME.textMain,
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const labelStyle = {
  display: 'block',
  fontFamily: MONO,
  fontSize: '0.68rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: THEME.textMuted,
  marginBottom: 6,
};

// Official multicolor Google "G" (brand asset) for the themed button.
function GoogleGIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AuthField({ label, type, value, onChange, autoFocus, autoComplete }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = `${THEME.accent}88`;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${THEME.accent}22`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = LINE;
          e.currentTarget.style.boxShadow = 'none';
        }}
        style={inputStyle}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        placeholder={type === 'password' ? '••••••••' : label}
      />
    </div>
  );
}

/**
 * Six single-digit OTP boxes: auto-advance, backspace-to-go-back, full-code
 * paste. Calls `onComplete(code)` once all six are filled.
 */
function OtpInput({ value, onChange, onComplete, disabled }) {
  const boxes = useRef([]);

  const digits = (value + '      ').slice(0, 6).split('');

  const setDigit = (i, d) => {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join('').trim());
  };

  const handleChange = (i, raw) => {
    const d = raw.replace(/\D/g, '').slice(-1);
    if (!d) return;
    setDigit(i, d);
    if (i < 5) boxes.current[i + 1]?.focus();
    const filled = digits.slice();
    filled[i] = d;
    if (filled.every((x) => x !== ' ' && x !== '')) onComplete?.(filled.join(''));
  };

  const handleKeyDown = (i, e) => {
    if (e.key !== 'Backspace') return;
    // Manage deletion manually: onChange ignores empty values, so letting
    // the browser clear the box would make React restore the digit.
    e.preventDefault();
    if (digits[i].trim()) {
      setDigit(i, ' '); // filled box -> clear it, stay put
    } else if (i > 0) {
      setDigit(i - 1, ' '); // empty box -> clear previous, move back
      boxes.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted);
    boxes.current[Math.min(pasted.length, 5)]?.focus();
    if (pasted.length === 6) onComplete?.(pasted);
  };

  return (
    <div className="flex items-center justify-center" style={{ gap: 8 }} onPaste={handlePaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            boxes.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          disabled={disabled}
          value={d.trim()}
          autoFocus={i === 0}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1} of 6`}
          style={{
            width: 44,
            height: 52,
            textAlign: 'center',
            fontFamily: MONO,
            fontSize: '1.3rem',
            fontWeight: 800,
            color: THEME.textMain,
            background: 'rgba(22, 27, 34, 0.65)',
            border: `1px solid ${d.trim() ? `${THEME.accent}88` : LINE}`,
            borderRadius: 10,
            outline: 'none',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Forgot / reset sub-views: request a code by email, enter it in six boxes,
 * and only then do the new-password fields appear.
 */
function ForgotResetView({
  view,
  email,
  setEmail,
  resetToken,
  setResetToken,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  otpVerified,
  busy,
  error,
  notice,
  onForgot,
  onVerify,
  onReset,
  onBack,
}) {
  const submitStyle = {
    width: '100%',
    fontFamily: MONO,
    fontSize: '0.82rem',
    fontWeight: 700,
    color: '#fff',
    background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 9999,
    padding: '10px 0',
    cursor: busy ? 'wait' : 'pointer',
    opacity: busy ? 0.75 : 1,
  };
  const backStyle = {
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: MONO,
    fontSize: '0.68rem',
    color: THEME.accent,
    cursor: 'pointer',
  };
  return (
    <div>
      {notice && (
        <p
          style={{
            fontFamily: MONO,
            fontSize: '0.74rem',
            color: THEME.textMain,
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${LINE}`,
            borderRadius: 10,
            padding: '9px 11px',
            margin: '0 0 14px',
            lineHeight: 1.6,
          }}
        >
          {notice}
        </p>
      )}
      {view === 'forgot' ? (
        <form onSubmit={onForgot}>
          <AuthField label="Email" type="email" value={email} onChange={setEmail} autoFocus autoComplete="email" />
          {error && (
            <p style={{ fontFamily: MONO, fontSize: '0.72rem', color: THEME.accent, margin: '0 0 12px' }}>
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} style={submitStyle}>
            {busy ? 'Sending…' : 'Send reset token'}
          </button>
        </form>
      ) : (
        <div>
          <p
            style={{
              fontFamily: MONO,
              fontSize: '0.74rem',
              color: THEME.textMuted,
              textAlign: 'center',
              margin: '0 0 14px',
            }}
          >
            Enter the 6-digit code sent to your email.
          </p>
          <div style={{ marginBottom: 14 }}>
            <OtpInput
              value={resetToken}
              onChange={setResetToken}
              onComplete={onVerify}
              disabled={busy || otpVerified}
            />
          </div>
          {error && (
            <p style={{ fontFamily: MONO, fontSize: '0.72rem', color: THEME.accent, margin: '0 0 12px', textAlign: 'center' }}>
              {error}
            </p>
          )}
          {!otpVerified ? (
            <button
              type="button"
              onClick={() => onVerify()}
              disabled={busy || resetToken.trim().length !== 6}
              style={submitStyle}
            >
              {busy ? 'Verifying…' : 'Verify code'}
            </button>
          ) : (
            <form onSubmit={onReset}>
              <AuthField label="New password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
              <AuthField label="Confirm new password" type="password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
              <button type="submit" disabled={busy} style={submitStyle}>
                {busy ? 'Updating…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>
      )}
      <p style={{ fontFamily: MONO, fontSize: '0.68rem', color: THEME.textMuted, textAlign: 'center', margin: '14px 0 0' }}>
        <button type="button" onClick={onBack} style={backStyle}>
          ← Back to sign in
        </button>
      </p>
    </div>
  );
}

/**
 * Login / register card for DistroPedia AI. One component, two modes
 * (local `mode` state). On success calls onAuthSuccess() — App navigates
 * to /chat.
 */
export default function AuthPage({ onAuthSuccess, onNavigate }) {
  const { login, register, googleLogin } = useAuth();
  const [mode, setMode] = useState('login');
  const [view, setView] = useState('auth'); // auth | forgot | reset
  const [resetToken, setResetToken] = useState(''); // 6-digit OTP
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [notice, setNotice] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
  };

  const openForgot = () => {
    setView('forgot');
    setError(null);
    setNotice(null);
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!email.trim()) {
      setError('Enter your account email first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const json = await apiForgot(email.trim());
      setNotice(json.message);
      setResetToken('');
      setOtpVerified(false);
      setPassword('');
      setConfirmPassword('');
      setView('reset');
    } catch (err) {
      setError(err.message || 'Could not start the reset. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!otpVerified) {
      setError('Verify the 6-digit code first.');
      return;
    }
    if (password.length < 6) {
      setError('Choose a 6+ character password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const json = await apiReset(resetToken.trim(), password);
      setNotice(json.message);
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
      setOtpVerified(false);
      setView('auth');
      setMode('login');
    } catch (err) {
      setError(err.message || 'Reset failed. The code may have expired.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (code) => {
    const otp = (code ?? resetToken).trim();
    if (!/^\d{6}$/.test(otp) || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiVerify(otp);
      setResetToken(otp);
      setOtpVerified(true);
      setNotice('Code verified — choose a new password.');
    } catch (err) {
      setOtpVerified(false);
      setError(err.message || 'Code is incorrect or expired.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    if (!email.trim() || !password || (mode === 'register' && !name.trim())) {
      setError('Please fill in all fields.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'register') {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      onAuthSuccess?.();
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Sign in with Google (GIS One Tap inline prompt — no separate window).
  // Skipped entirely when no client id is configured. The themed button
  // opens Google's account chooser; the ID token goes straight to the
  // backend for verification + find-or-link-or-create.
  const handleGoogle = async (response) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await googleLogin(response?.credential);
      onAuthSuccess?.();
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const handleGoogleClick = () => {
    if (busy) return;
    if (!window.google?.accounts?.id) {
      setError('Google sign-in is still loading. Please try again in a moment.');
      return;
    }
    setError(null);
    window.google.accounts.id.prompt((notification) => {
      try {
        if (typeof notification.isDisplayed === 'function' && notification.isDisplayed()) return;
        const reason =
          typeof notification.getNotDisplayedReason === 'function'
            ? notification.getNotDisplayedReason()
            : '';
        if (
          reason === 'opt_out_or_no_session' ||
          reason === 'suppressed_by_user' ||
          reason === 'fedcm_disabled'
        ) {
          // Chrome disabled FedCM for this site (usually after dismissing the
          // prompt before). Re-enable: icon left of the address bar →
          // Site settings → Third-party sign-in → Allow, then retry.
          setError(
            'Google sign-in is turned off for this site in your browser — click the icon left of the address bar → Site settings → Third-party sign-in → Allow, then try again.'
          );
        } else if (
          notification.isNotDisplayed() ||
          notification.isSkippedMoment?.()
        ) {
          setError(
            'Google sign-in was blocked or dismissed — allow third-party sign-in and try again, or use email instead.'
          );
        }
      } catch {
        /* older GIS without Moment API — the callback still fires on success */
      }
    });
  };
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || view !== 'auth') return;
    let cancelled = false;
    const init = () => {
      if (cancelled || !window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogle,
      });
    };
    if (window.google?.accounts?.id) init();
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return (
    <div
      style={{
        backgroundColor: THEME.bg,
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
      }}
      className="text-[#F0F4F8]"
    >
      {/* Shared hero background texture */}
      <div className="hero-bg fixed inset-0 z-0" aria-hidden="true">
        <div className="grain-fine" />
        <div className="grain-fiber" />
      </div>

      <Navbar currentRoute="/login" onNavigate={onNavigate} />

      <div
        className="relative z-10 flex items-center justify-center"
        style={{ minHeight: '100vh', padding: '96px 16px 48px' }}
      >
        <div
          className="w-full"
          style={{
            maxWidth: 400,
            background: 'rgba(28, 34, 41, 0.72)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            border: `1px solid ${LINE}`,
            borderRadius: 20,
            padding: '26px 24px 22px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          }}
        >
          {/* Brand */}
          <div className="flex flex-col items-center text-center" style={{ marginBottom: 20 }}>
            <div
              className="flex items-center justify-center"
              style={{
                width: 46,
                height: 46,
                borderRadius: 9999,
                background: THEME.bg,
                border: `1px solid ${LINE_SOFT}`,
                marginBottom: 12,
              }}
            >
              <Bot size={22} color={THEME.accent} />
            </div>
            <h1
              style={{
                fontFamily: MONO,
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                margin: 0,
              }}
            >
              <span style={{ color: THEME.textMain }}>Distro</span>
              <span style={{ color: THEME.accent }}>Pedia</span>
              <span style={{ color: THEME.silver }}> AI</span>
            </h1>
            <p
              style={{
                fontFamily: MONO,
                fontSize: '0.74rem',
                color: THEME.textMuted,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              Your AI Linux assistant. Sign in to start chatting.
            </p>
          </div>

          {/* Mode toggle + sign-in/up form */}
          {view === 'auth' ? (
          <>
          {/* Mode toggle */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: 4,
              background: 'rgba(22, 27, 34, 0.6)',
              border: `1px solid ${LINE}`,
              borderRadius: 9999,
              marginBottom: 18,
            }}
          >
            {[
              { id: 'login', label: 'Sign in' },
              { id: 'register', label: 'Create account' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => switchMode(m.id)}
                style={{
                  flex: 1,
                  fontFamily: MONO,
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                  padding: '7px 0',
                  borderRadius: 9999,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease',
                  background: mode === m.id ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: mode === m.id ? THEME.textMain : THEME.textMuted,
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <AuthField
                label="Name"
                type="text"
                value={name}
                onChange={setName}
                autoFocus
                autoComplete="name"
              />
            )}
            <AuthField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoFocus={mode === 'login'}
              autoComplete="email"
            />
            <AuthField
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            />
            {mode === 'login' && (
              <div style={{ textAlign: 'right', margin: '-6px 0 12px' }}>
                <button
                  type="button"
                  onClick={openForgot}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontFamily: MONO,
                    fontSize: '0.68rem',
                    color: THEME.textMuted,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = THEME.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = THEME.textMuted;
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Inline error message */}
            {error && (
              <div
                className="flex items-start gap-2"
                style={{
                  background: `${THEME.accent}1A`,
                  border: `1px solid ${THEME.accent}55`,
                  borderRadius: 10,
                  padding: '9px 11px',
                  marginBottom: 14,
                }}
                role="alert"
              >
                <AlertCircle size={14} color={THEME.accent} className="shrink-0 mt-0.5" />
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: '0.74rem',
                    color: THEME.accentSoft,
                    lineHeight: 1.5,
                  }}
                >
                  {error}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                width: '100%',
                fontFamily: MONO,
                fontSize: '0.82rem',
                fontWeight: 700,
                letterSpacing: '0.03em',
                color: '#fff',
                background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 9999,
                padding: '10px 0',
                cursor: busy ? 'wait' : 'pointer',
                opacity: busy ? 0.75 : 1,
                boxShadow: `0 2px 16px ${THEME.accent}55, 0 1px 0 rgba(255,255,255,0.35) inset`,
                transition: 'transform 0.16s ease, box-shadow 0.16s ease, opacity 0.16s ease',
              }}
              onMouseEnter={(e) => {
                if (!busy) e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {busy
                ? mode === 'login'
                  ? 'Signing in…'
                  : 'Creating account…'
                : mode === 'login'
                  ? 'Sign in'
                  : 'Create account'}
            </button>
          </form>

          <p
            style={{
              fontFamily: MONO,
              fontSize: '0.68rem',
              color: THEME.textMuted,
              textAlign: 'center',
              margin: '14px 0 0',
            }}
          >
            {mode === 'login' ? 'New here? ' : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontFamily: MONO,
                fontSize: '0.68rem',
                color: THEME.accent,
                cursor: 'pointer',
              }}
            >
              {mode === 'login' ? 'Create an account' : 'Sign in instead'}
            </button>
          </p>

          {/* Sign in with Google (hidden when no client id is configured) */}
          {GOOGLE_CLIENT_ID && (
            <>
              <div
                className="flex items-center"
                style={{ gap: 10, margin: '18px 0 14px' }}
                aria-hidden="true"
              >
                <div style={{ flex: 1, height: 1, background: LINE }} />
                <span style={{ fontFamily: MONO, fontSize: '0.66rem', color: THEME.textMuted }}>
                  or
                </span>
                <div style={{ flex: 1, height: 1, background: LINE }} />
              </div>
              <div
                style={{ display: 'flex', justifyContent: 'center', minHeight: 40 }}
              >
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={busy}
                  className="flex items-center justify-center transition-all"
                  style={{
                    gap: 10,
                    width: '100%',
                    fontFamily: MONO,
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                    color: THEME.textMain,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: `1px solid ${LINE_SOFT}`,
                    borderRadius: 9999,
                    padding: '10px 0',
                    cursor: busy ? 'wait' : 'pointer',
                    opacity: busy ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!busy) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = LINE_SOFT;
                  }}
                >
                  <GoogleGIcon size={17} />
                  Continue with Google
                </button>
              </div>
            </>
          )}
          </>
          ) : (
            /* Forgot / reset views */
            <ForgotResetView
              view={view}
              email={email}
              setEmail={setEmail}
              resetToken={resetToken}
              setResetToken={setResetToken}
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              otpVerified={otpVerified}
              busy={busy}
              error={error}
              notice={notice}
              onForgot={handleForgot}
              onVerify={handleVerifyOtp}
              onReset={handleReset}
              onBack={() => {
                setView('auth');
                setError(null);
                setNotice(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
