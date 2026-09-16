import React, { useRef, useState, useEffect } from 'react';
import { MessageSquare, ExternalLink, Share2, Pencil, Trash2, Check, Link2 } from 'lucide-react';
import { THEME, LINE, MONO } from '../../theme/designTokens.js';
import VotePill from './VotePill.jsx';
import { ChannelAvatar } from './Avatar.jsx';
import { timeAgo } from '../../utils/timeAgo.js';

// Small mono text action (Share / Edit / Delete) with icon
export function RowAction({ icon, label, onClick, danger, stop }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        if (stop) e.stopPropagation();
        onClick?.(e);
      }}
      className="inline-flex items-center transition-colors"
      style={{
        gap: 5,
        fontFamily: MONO,
        fontSize: '0.7rem',
        fontWeight: 600,
        color: THEME.textMuted,
        background: 'none',
        border: 'none',
        padding: '4px 8px',
        borderRadius: 9999,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.color = danger ? THEME.accent : THEME.textMain;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = THEME.textMuted;
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// Rough plain-text preview of a markdown body (first ~220 chars)
const previewText = (body) =>
  (body || '')
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/[#>*_`~\-]{1,3}/g, ' ')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Reddit-style flat post row: channel avatar + meta, big title, 2-line
 * body preview, horizontal action bar. Opens the post on click (vote /
 * share / link / owner actions excluded).
 */
export default function PostCard({
  post,
  distro,
  onOpen,
  onVote,
  isOwner = false,
  onEdit,
  onDelete,
}) {
  const [shared, setShared] = useState(false);
  const shareTimer = useRef(null);
  useEffect(() => () => clearTimeout(shareTimer.current), []);

  const hostname = (() => {
    try {
      return new URL(post.linkUrl).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  })();

  const handleShare = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/community/${post.id}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setShared(true);
    clearTimeout(shareTimer.current);
    shareTimer.current = setTimeout(() => setShared(false), 1500);
  };

  const preview = previewText(post.body);

  return (
    <article
      onClick={() => onOpen?.(post)}
      className="cursor-pointer"
      style={{ padding: '14px 4px', borderBottom: `1px solid ${LINE}` }}
    >
      {/* Meta: channel avatar + d/name • author • time */}
      <div className="flex items-center" style={{ gap: 8, marginBottom: 8 }}>
        <ChannelAvatar channel={post.channel} distro={distro} size={26} />
        <span
          style={{
            fontFamily: MONO,
            fontSize: '0.72rem',
            fontWeight: 700,
            color: THEME.textMain,
          }}
        >
          d/{post.channel === 'general' ? 'General' : post.channel}
        </span>
        <span style={{ color: THEME.textMuted, fontSize: '0.6rem' }}>•</span>
        <span style={{ fontFamily: MONO, fontSize: '0.68rem', color: THEME.silver }}>
          u/{post.author?.name || 'unknown'}
        </span>
        <span style={{ color: THEME.textMuted, fontSize: '0.6rem' }}>•</span>
        <span style={{ fontFamily: MONO, fontSize: '0.68rem', color: THEME.textMuted }}>
          {timeAgo(post.createdAt)}
          {post.updatedAt && post.updatedAt !== post.createdAt
            ? ` · edited ${timeAgo(post.updatedAt)}`
            : ''}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          fontFamily: MONO,
          fontSize: '1.02rem',
          fontWeight: 700,
          color: THEME.textMain,
          margin: 0,
          lineHeight: 1.45,
          overflowWrap: 'anywhere',
        }}
      >
        {post.title}
      </h3>

      {/* External link */}
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
          <Link2 size={11} />
          {hostname}
        </a>
      )}

      {/* Body preview (2-line clamp) */}
      {preview && (
        <p
          style={{
            margin: '6px 0 0',
            fontFamily: MONO,
            fontSize: '0.78rem',
            lineHeight: 1.6,
            color: THEME.silver,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            overflowWrap: 'anywhere',
          }}
        >
          {preview}
        </p>
      )}

      {/* Action bar */}
      <div className="flex items-center flex-wrap" style={{ gap: 8, marginTop: 12 }}>
        <VotePill score={post.score} userVote={post.userVote} onVote={onVote} />
        <RowAction
          icon={<MessageSquare size={14} />}
          label={`${post.commentCount ?? 0} ${
            (post.commentCount ?? 0) === 1 ? 'comment' : 'comments'
          }`}
          onClick={() => onOpen?.(post)}
        />
        <RowAction
          icon={shared ? <Check size={14} /> : <Share2 size={14} />}
          label={shared ? 'Copied' : 'Share'}
          onClick={handleShare}
          stop
        />
        {isOwner && (
          <>
            <RowAction icon={<Pencil size={13} />} label="Edit" onClick={() => onEdit?.(post)} stop />
            <RowAction
              icon={<Trash2 size={13} />}
              label="Delete"
              danger
              onClick={() => onDelete?.(post)}
              stop
            />
          </>
        )}
        {post.linkUrl && hostname && (
          <span className="hidden sm:inline-flex">
            <RowAction
              icon={<ExternalLink size={13} />}
              label={hostname}
              onClick={() => window.open(post.linkUrl, '_blank', 'noopener')}
              stop
            />
          </span>
        )}
      </div>
    </article>
  );
}
