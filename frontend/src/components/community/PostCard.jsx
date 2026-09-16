import React from 'react';
import { MessageSquare, ExternalLink } from 'lucide-react';
import { THEME, LINE, MONO } from '../../theme/designTokens.js';
import VoteButtons from './VoteButtons.jsx';
import { timeAgo } from '../../utils/timeAgo.js';

// Glassmorphism surface matching ChatPage
const GLASS = {
  background: 'rgba(28, 34, 41, 0.55)',
  backdropFilter: 'blur(28px) saturate(170%)',
  WebkitBackdropFilter: 'blur(28px) saturate(170%)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
};

// Small channel chip: accent dot + label (distro name for distro channels)
export function ChannelBadge({ channel, distro }) {
  const isGeneral = channel === 'general';
  const dotColor = isGeneral ? THEME.accent : distro?.accent || THEME.silver;
  const label = isGeneral ? 'General' : distro?.name || channel;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: MONO,
        fontSize: '0.66rem',
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: THEME.silver,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${LINE}`,
        borderRadius: 9999,
        padding: '3px 10px',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 9999,
          background: dotColor,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

/**
 * Reddit-style glass post card. The whole card opens the post, except the
 * vote rail (stops propagation) and the external link.
 */
export default function PostCard({ post, distro, onOpen, onVote }) {
  const hostname = (() => {
    try {
      return new URL(post.linkUrl).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  })();

  return (
    <article
      onClick={() => onOpen?.(post)}
      className="flex cursor-pointer transition-colors"
      style={{
        ...GLASS,
        borderRadius: 18,
        padding: 14,
        gap: 12,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
      }}
    >
      {/* Vote rail */}
      <VoteButtons score={post.score} userVote={post.userVote} onVote={onVote} />

      {/* Main */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Meta */}
        <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 7 }}>
          <ChannelBadge channel={post.channel} distro={distro} />
          <span
            style={{
              fontFamily: MONO,
              fontSize: '0.68rem',
              color: THEME.silver,
            }}
          >
            posted by u/{post.author?.name || 'unknown'}
          </span>
          <span style={{ fontFamily: MONO, fontSize: '0.68rem', color: THEME.textMuted }}>
            {timeAgo(post.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: MONO,
            fontSize: '0.98rem',
            fontWeight: 700,
            color: THEME.textMain,
            margin: 0,
            lineHeight: 1.45,
            overflowWrap: 'anywhere',
          }}
        >
          {post.title}
        </h3>

        {/* Optional external link */}
        {post.linkUrl && hostname && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center transition-colors"
            style={{
              marginTop: 6,
              gap: 4,
              fontFamily: MONO,
              fontSize: '0.7rem',
              color: THEME.accent,
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
              e.currentTarget.style.textUnderlineOffset = 2;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            <ExternalLink size={11} />
            {hostname}
          </a>
        )}

        {/* Footer */}
        <div
          className="flex items-center"
          style={{ gap: 6, marginTop: 10, color: THEME.textMuted }}
        >
          <MessageSquare size={13} />
          <span style={{ fontFamily: MONO, fontSize: '0.7rem' }}>
            {post.commentCount ?? 0} {(post.commentCount ?? 0) === 1 ? 'comment' : 'comments'}
          </span>
        </div>
      </div>
    </article>
  );
}
