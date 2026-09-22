import React from 'react';
import { THEME, LINE } from '../../theme/designTokens.js';
import useMedia from '../../hooks/useMedia.js';

/**
 * Reddit-style three-column community frame:
 * [left nav 236px] [center flex] [right rail 300px] — rails hide on
 * narrower viewports. `nav` and `rail` are already-built node trees.
 * `mobileBar` renders above the feed when the left nav is hidden, so
 * channel switching + creating posts stay reachable on small screens.
 */
export default function CommunityShell({ nav, rail, mobileBar, children }) {
  const showNav = useMedia('(min-width: 1024px)');
  const showRail = useMedia('(min-width: 1280px)');

  return (
    <div style={{ backgroundColor: THEME.bg, minHeight: '100vh', position: 'relative' }}>
      {/* Shared hero background texture */}
      <div className="hero-bg fixed inset-0 z-0" aria-hidden="true">
        <div className="grain-fine" />
        <div className="grain-fiber" />
      </div>

      <div
        className="relative z-10 mx-auto flex"
        style={{
          maxWidth: 1320,
          gap: 20,
          padding: '12px 12px 64px',
          alignItems: 'flex-start',
        }}
      >
        {nav && showNav && nav}
        <main style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
          {mobileBar && !showNav && (
            <div style={{ marginBottom: 12 }}>{mobileBar}</div>
          )}
          {children}
        </main>
        {rail && showRail && (
          <div
            style={{
              width: 300,
              flexShrink: 0,
              position: 'sticky',
              top: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              maxHeight: 'calc(100vh - 32px)',
              overflowY: 'auto',
            }}
          >
            {rail}
          </div>
        )}
      </div>
    </div>
  );
}

/** Glass card with an uppercase section label, used across the rails. */
export function RailCard({ label, action, children }) {
  return (
    <section
      style={{
        borderRadius: 18,
        padding: '14px 14px 12px',
        background: 'rgba(28, 34, 41, 0.55)',
        backdropFilter: 'blur(28px) saturate(170%)',
        WebkitBackdropFilter: 'blur(28px) saturate(170%)',
        border: `1px solid ${LINE}`,
        overflow: 'hidden',
      }}
    >
      {(label || action) && (
        <div
          className="flex items-center justify-between"
          style={{
            marginBottom: 10,
            fontFamily: 'JetBrains Mono, monospace, ui-monospace, monospace',
            fontSize: '0.62rem',
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: THEME.textMuted,
          }}
        >
          <span>{label}</span>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
