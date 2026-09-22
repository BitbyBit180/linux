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
 * `disabled` locks BOTH arrows while a vote request is in flight so up + down
 * can never be fired at the same time (prevents race / double-active state).
 */
export default function VotePill({ score = 0, userVote = 0, onVote, size = 16, disabled = false }) {
  const arrowBtn = (dir) => {
    const dirValue = dir === 'up' ? 1 : -1;
    const active = userVote === dirValue;
    return (
      <button
        type="button"
        title={dir === 'up' ? 'Upvote' : 'Downvote'}
        aria-label={dir === 'up' ? 'Upvote' : 'Downvote'}
        aria-pressed={active}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          onVote?.(userVote === dirValue ? 0 : dirValue);
        }}
        className="flex items-center justify-center transition-colors"
        style={{
          width: 26,
          height: 24,
          borderRadius: 9999,
          border: active ? `1px solid ${dir === 'up' ? 'rgba(224, 90, 56, 0.5)' : 'rgba(90, 140, 255, 0.5)'}` : '1px solid transparent',
          background: active
            ? dir === 'up'
              ? 'rgba(224, 90, 56, 0.16)'
              : 'rgba(90, 140, 255, 0.16)'
            : 'transparent',
          color: active ? scoreColor(dir === 'up' ? 1 : -1) : THEME.textMuted,
          cursor: disabled ? 'wait' : 'pointer',
          opacity: disabled && !active ? 0.5 : 1,
          padding: 0,
        }}
        onMouseEnter={(e) => {
          if (!active && !disabled) e.currentTarget.style.color = scoreColor(dir === 'up' ? 1 : -1);
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
