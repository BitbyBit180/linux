import React, { useEffect, useState } from 'react';
import { Globe, Lock, FileText } from 'lucide-react';
import { THEME, LINE, MONO } from '../../theme/designTokens.js';
import { RailCard } from './CommunityShell.jsx';
import { RailListSkeleton } from '../Skeleton.jsx';
import { ChannelAvatar } from './Avatar.jsx';
import { timeAgo } from '../../utils/timeAgo.js';
import { listPosts, getChannelStats } from '../../services/communityApi.js';

const railText = { fontFamily: MONO, fontSize: '0.72rem', color: THEME.silver, lineHeight: 1.6 };

/** "About" card: totals across the whole community. */
export function AboutCommunity() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getChannelStats('all')
      .then((s) => !cancelled && setStats(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RailCard label="Community">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: '1.1rem',
              fontWeight: 800,
              color: THEME.textMain,
            }}
          >
            {stats ? stats.posts : '—'}
          </div>
          <div style={{ ...railText, fontSize: '0.62rem' }}>posts</div>
        </div>
        <div style={{ width: 1, height: 30, background: LINE }} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: '1.1rem',
              fontWeight: 800,
              color: THEME.textMain,
            }}
          >
            {stats ? stats.comments : '—'}
          </div>
          <div style={{ ...railText, fontSize: '0.62rem' }}>comments</div>
        </div>
      </div>
      <div className="flex items-center" style={{ gap: 6, ...railText }}>
        <Globe size={12} />
        Public community
      </div>
      <div className="flex items-center" style={{ gap: 6, marginTop: 6, ...railText }}>
        <Lock size={12} />
        Login required to post
      </div>
    </RailCard>
  );
}

/** "About this channel" card on the post detail page. */
export function AboutChannel({ channel, distro, stats }) {
  const isGeneral = channel === 'general';
  const name = isGeneral ? 'General' : distro?.name || channel;
  const tagline = isGeneral
    ? 'Everything Linux — introductions, news and off-topic chat.'
    : distro?.tagline || `Discussions about ${name}.`;

  return (
    <RailCard label="About this channel">
      <div className="flex items-center" style={{ gap: 10, marginBottom: 8 }}>
        <ChannelAvatar channel={channel} distro={distro} size={40} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: '0.86rem',
              fontWeight: 800,
              color: THEME.textMain,
              overflowWrap: 'anywhere',
            }}
          >
            d/{isGeneral ? 'General' : channel}
          </div>
          <div style={{ ...railText, fontSize: '0.62rem' }}>{name}</div>
        </div>
      </div>
      <p style={{ ...railText, margin: '0 0 10px' }}>{tagline}</p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: '0.92rem', fontWeight: 800, color: THEME.textMain }}>
            {stats ? stats.posts : '—'}
          </div>
          <div style={{ ...railText, fontSize: '0.6rem' }}>posts</div>
        </div>
        <div style={{ width: 1, height: 26, background: LINE }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: MONO, fontSize: '0.92rem', fontWeight: 800, color: THEME.textMain }}>
            {stats ? stats.comments : '—'}
          </div>
          <div style={{ ...railText, fontSize: '0.6rem' }}>comments</div>
        </div>
      </div>
      <div className="flex items-center" style={{ gap: 6, ...railText }}>
        <Globe size={12} />
        Public
      </div>
    </RailCard>
  );
}

/** "Recent posts" card: five newest posts across all channels. */
export function RecentPosts({ onOpen }) {
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    let cancelled = false;
    listPosts({ sort: 'new', page: 1, limit: 5 })
      .then((d) => !cancelled && setRecent(d.posts || []))
      .catch(() => !cancelled && setRecent([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RailCard label="Recent posts">
      {recent === null && <RailListSkeleton count={4} />}
      {recent?.length === 0 && (
        <p style={{ ...railText, margin: 0, fontSize: '0.66rem' }}>Nothing posted yet.</p>
      )}
      {recent?.map((p, i) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onOpen?.(p)}
          className="w-full text-left transition-colors"
          style={{
            background: 'none',
            border: 'none',
            borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
            padding: '10px 2px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'none';
          }}
        >
          <div className="flex items-center" style={{ gap: 6, marginBottom: 4 }}>
            <ChannelAvatar channel={p.channel} size={18} />
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.62rem',
                fontWeight: 700,
                color: THEME.silver,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              d/{p.channel === 'general' ? 'General' : p.channel}
            </span>
            <span style={{ color: THEME.textMuted, fontSize: '0.55rem' }}>•</span>
            <span style={{ fontFamily: MONO, fontSize: '0.6rem', color: THEME.textMuted }}>
              {timeAgo(p.createdAt)}
            </span>
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontSize: '0.74rem',
              fontWeight: 700,
              color: THEME.textMain,
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textAlign: 'left',
            }}
          >
            {p.title}
          </div>
          <div style={{ fontFamily: MONO, fontSize: '0.62rem', color: THEME.textMuted, marginTop: 4 }}>
            {p.score} {p.score === 1 ? 'upvote' : 'upvotes'} · {p.commentCount}{' '}
            {p.commentCount === 1 ? 'comment' : 'comments'}
          </div>
        </button>
      ))}
    </RailCard>
  );
}

/** Static community rules card (Reddit-style numbered list). */
export function CommunityRules() {
  const rules = [
    'Search the community before posting',
    'Use the right channel for your topic',
    'Be kind — no flame wars',
    'No low-quality posts or spam',
  ];
  return (
    <RailCard label="Community rules">
      <ol style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {rules.map((r, i) => (
          <li
            key={r}
            className="flex"
            style={{
              gap: 10,
              padding: '8px 0',
              borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.68rem',
                fontWeight: 800,
                color: THEME.textMuted,
                minWidth: 14,
              }}
            >
              {i + 1}
            </span>
            <span style={{ ...railText, fontSize: '0.68rem' }}>{r}</span>
          </li>
        ))}
      </ol>
      <div className="flex items-center" style={{ gap: 6, marginTop: 6, ...railText }}>
        <FileText size={12} />
        Moderated by DistroPedia admins
      </div>
    </RailCard>
  );
}
