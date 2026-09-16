import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { THEME, MONO } from '../../theme/designTokens.js';

// Score color: accent when positive, blue-ish when negative, silver at 0
const scoreColor = (score) => {
  if (score > 0) return THEME.accent;
  if (score < 0) return 'rgba(90, 140, 255, 0.9)';
  return THEME.silver;
};

const btn = (active) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 22,
  borderRadius: 7,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 0,
  transition: 'background 0.15s ease, color 0.15s ease, transform 0.1s ease',
  color: active ? scoreColor(active === 'up' ? 1 : -1) : THEME.textMuted,
  ...(active ? { background: 'rgba(255,255,255,0.08)' } : null),
});

/**
 * Vertical vote rail: ▲ score ▼
 * Clicking the already-active direction sends value 0 (un-vote).
 * The parent owns the optimistic state — we only report the intent.
 */
export default function VoteButtons({ score = 0, userVote = 0, onVote, size = 17 }) {
  const handle = (dir) => {
    const value = dir === 'up' ? 1 : -1;
    onVote?.(userVote === value ? 0 : value);
  };

  return (
    <div
      className="flex flex-col items-center shrink-0 select-none"
      style={{ gap: 2, minWidth: 34 }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        title="Upvote"
        aria-label="Upvote"
        onClick={() => handle('up')}
        style={btn(userVote === 1 ? 'up' : null)}
        onMouseEnter={(e) => {
          if (userVote !== 1) e.currentTarget.style.color = scoreColor(1);
        }}
        onMouseLeave={(e) => {
          if (userVote !== 1) e.currentTarget.style.color = THEME.textMuted;
        }}
      >
        <ChevronUp size={size} strokeWidth={2.6} />
      </button>
      <span
        style={{
          fontFamily: MONO,
          fontSize: '0.78rem',
          fontWeight: 800,
          lineHeight: 1.2,
          color: scoreColor(score),
          minWidth: 24,
          textAlign: 'center',
        }}
      >
        {score}
      </span>
      <button
        type="button"
        title="Downvote"
        aria-label="Downvote"
        onClick={() => handle('down')}
        style={btn(userVote === -1 ? 'down' : null)}
        onMouseEnter={(e) => {
          if (userVote !== -1) e.currentTarget.style.color = scoreColor(-1);
        }}
        onMouseLeave={(e) => {
          if (userVote !== -1) e.currentTarget.style.color = THEME.textMuted;
        }}
      >
        <ChevronDown size={size} strokeWidth={2.6} />
      </button>
    </div>
  );
}
