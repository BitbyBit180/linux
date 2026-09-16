import React, { useState } from 'react';
import { Bot, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../hooks/useAuth.js';
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
 * Login / register card for DistroPedia AI. One component, two modes
 * (local `mode` state). On success calls onAuthSuccess() — App navigates
 * to /chat.
 */
export default function AuthPage({ onAuthSuccess, onNavigate }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
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
        </div>
      </div>
    </div>
  );
}
