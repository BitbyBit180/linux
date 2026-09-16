import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { THEME, LINE, MONO } from '../../theme/designTokens.js';

const scoreColor = (score) => {
  if (score > 0) return THEME.accent;
  if (score < 0) return 'rgba(90, 140, 255, 0.9)';
  return THEME.textMain;
};

/**
 * Horizontal vote pill (Reddit action-bar style): ▲ score ▼ in one container.
 * Clicking the active direction sends 0 (un-vote); parent owns optimistic state.
 */
export default function VotePill({ score = 0, userVote = 0, onVote, size = 16 }) {
  const arrowBtn = (dir) => {
    const active = userVote === (dir === 'up' ? 1 : -1);
    return (
      <button
        type="button"
        title={dir === 'up' ? 'Upvote' : 'Downvote'}
        aria-label={dir === 'up' ? 'Upvote' : 'Downvote'}
        onClick={(e) => {
          e.stopPropagation();
          onVote?.(userVote === (dir === 'up' ? 1 : -1) ? 0 : dir === 'up' ? 1 : -1);
        }}
        className="flex items-center justify-center transition-colors"
        style={{
          width: 26,
          height: 24,
          borderRadius: 9999,
          border: 'none',
          background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
          color: active ? scoreColor(dir === 'up' ? 1 : -1) : THEME.textMuted,
          cursor: 'pointer',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.color = scoreColor(dir === 'up' ? 1 : -1);
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.color = THEME.textMuted;
        }}
      >
        {dir === 'up' ? (
          <ChevronUp size={size} strokeWidth={2.6} />
        ) : (
          <ChevronDown size={size} strokeWidth={2.6} />
        )}
      </button>
    );
  };

  return (
    <div
      className="inline-flex items-center select-none"
      style={{
        gap: 2,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${LINE}`,
        borderRadius: 9999,
        padding: '1px 4px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {arrowBtn('up')}
      <span
        style={{
          fontFamily: MONO,
          fontSize: '0.74rem',
          fontWeight: 800,
          color: scoreColor(score),
          minWidth: 18,
          textAlign: 'center',
        }}
      >
        {score}
      </span>
      {arrowBtn('down')}
    </div>
  );
}
