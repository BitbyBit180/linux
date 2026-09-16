import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Users, Plus, Search, Loader2 } from 'lucide-react';
import AuthPage from './AuthPage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useDistros } from '../hooks/useDistros.js';
import { THEME, LINE, LINE_SOFT, MONO } from '../theme/designTokens.js';
import PostCard from '../components/community/PostCard.jsx';
import { listPosts, createPost, votePost } from '../services/communityApi.js';

/* --------------------------------- tokens --------------------------------- */

const GLASS = {
  background: 'rgba(28, 34, 41, 0.55)',
  backdropFilter: 'blur(28px) saturate(170%)',
  WebkitBackdropFilter: 'blur(28px) saturate(170%)',
  border: '1px solid rgba(255, 255, 255, 0.14)',
};

const SORTS = [
  { key: 'hot', label: 'Hot' },
  { key: 'new', label: 'New' },
  { key: 'top', label: 'Top' },
];

const PAGE_SIZE = 10;

/* -------------------------------- composer -------------------------------- */

function Composer({ distros, defaultChannel, posting, onPost, onCancel }) {
  const [channel, setChannel] = useState(defaultChannel === 'all' ? 'general' : defaultChannel);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [localError, setLocalError] = useState(null);

  // Re-seed the channel when the selected tab changes (and the composer is open)
  useEffect(() => {
    setChannel(defaultChannel === 'all' ? 'general' : defaultChannel);
  }, [defaultChannel]);

  const titleValid = title.trim().length >= 3;

  const handleSubmit = () => {
    if (!titleValid) {
      setLocalError('Title is required (at least 3 characters).');
      return;
    }
    if (linkUrl.trim() && !/^https?:\/\//i.test(linkUrl.trim())) {
      setLocalError('Link URL must start with http:// or https://');
      return;
    }
    setLocalError(null);
    onPost({
      channel,
      title: title.trim(),
      body: body.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
    });
  };

  return (
    <div className="dp-fade" style={{ ...GLASS, borderRadius: 18, padding: 16 }}>
      {/* Channel select */}
      <label
        style={{
          display: 'block',
          fontFamily: MONO,
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: THEME.textMuted,
          marginBottom: 6,
        }}
      >
        Channel
      </label>
      <select
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: MONO,
          fontSize: '0.8rem',
          color: THEME.textMain,
          background: 'rgba(20, 24, 32, 0.6)',
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          padding: '8px 10px',
          outline: 'none',
          cursor: 'pointer',
          marginBottom: 12,
        }}
      >
        <option value="general">General</option>
        {distros.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      {/* Title */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title (min. 3 characters)"
        maxLength={200}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: MONO,
          fontSize: '0.88rem',
          fontWeight: 700,
          color: THEME.textMain,
          background: 'rgba(20, 24, 32, 0.6)',
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          padding: '10px 12px',
          outline: 'none',
          marginBottom: 10,
        }}
      />

      {/* Body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What do you want to share? (optional)"
        rows={5}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          resize: 'vertical',
          fontFamily: MONO,
          fontSize: '0.8rem',
          lineHeight: 1.6,
          color: THEME.textMain,
          background: 'rgba(20, 24, 32, 0.6)',
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          padding: '10px 12px',
          outline: 'none',
          marginBottom: 4,
        }}
      />
      <p
        style={{
          margin: '0 0 8px',
          fontFamily: MONO,
          fontSize: '0.64rem',
          color: THEME.textMuted,
        }}
      >
        Markdown supported — code fences, lists, links and tables all render.
      </p>

      {/* Link URL */}
      <input
        value={linkUrl}
        onChange={(e) => setLinkUrl(e.target.value)}
        placeholder="Link URL (optional — https://…)"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          fontFamily: MONO,
          fontSize: '0.76rem',
          color: THEME.textMain,
          background: 'rgba(20, 24, 32, 0.6)',
          border: `1px solid ${LINE}`,
          borderRadius: 10,
          padding: '8px 12px',
          outline: 'none',
          marginBottom: 12,
        }}
      />

      {localError && (
        <p
          style={{
            margin: '0 0 10px',
            fontFamily: MONO,
            fontSize: '0.7rem',
            color: THEME.accent,
          }}
        >
          {localError}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            fontFamily: MONO,
            fontSize: '0.76rem',
            fontWeight: 700,
            color: THEME.silver,
            background: 'transparent',
            border: `1px solid ${LINE_SOFT}`,
            borderRadius: 9999,
            padding: '7px 16px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={posting || !titleValid}
          className="transition-all"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: MONO,
            fontSize: '0.76rem',
            fontWeight: 700,
            color: '#fff',
            background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 9999,
            padding: '7px 18px',
            cursor: posting || !titleValid ? 'not-allowed' : 'pointer',
            opacity: posting || !titleValid ? 0.55 : 1,
            boxShadow: `0 2px 14px ${THEME.accent}55`,
          }}
        >
          {posting && <Loader2 size={13} className="animate-spin" />}
          Post
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ community page ----------------------------- */

export default function CommunityPage({ onNavigate }) {
  const { token, logout } = useAuth();
  const { distros } = useDistros();

  const distroMap = useMemo(
    () => Object.fromEntries(distros.map((d) => [d.id, d])),
    [distros]
  );

  const [channel, setChannel] = useState('all'); // all | general | <distroId>
  const [sort, setSort] = useState('hot');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState(''); // applied after debounce

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const [composerOpen, setComposerOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const [votingId, setVotingId] = useState(null);

  const requestIdRef = useRef(0);

  /* ---------------------------- debounced search ---------------------------- */
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ------------------------------- data loading ----------------------------- */

  const fetchPage = useCallback(
    async (targetPage, { append = false } = {}) => {
      const reqId = ++requestIdRef.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await listPosts({ channel, sort, search, page: targetPage, limit: PAGE_SIZE });
        if (reqId !== requestIdRef.current) return; // stale response
        setPosts((prev) => (append ? [...prev, ...(data.posts || [])] : data.posts || []));
        setPage(data.page || targetPage);
        setHasMore(Boolean(data.hasMore));
      } catch (err) {
        if (reqId !== requestIdRef.current) return;
        if (err.status === 401) {
          logout();
          return;
        }
        setError(err.message || 'Could not load the community feed.');
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [channel, sort, search, logout]
  );

  // Reload page 1 whenever the filters change
  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  /* --------------------------------- actions -------------------------------- */

  const handleVote = async (post, value) => {
    const prevScore = post.score;
    const prevVote = post.userVote;
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, score: prevScore + (value - prevVote), userVote: value }
          : p
      )
    );
    setVotingId(post.id);
    try {
      const data = await votePost(post.id, value);
      // Reconcile with the server's authoritative numbers
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, score: data.score, userVote: data.userVote }
            : p
        )
      );
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      // Revert on any other failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, score: prevScore, userVote: prevVote } : p
        )
      );
      setError(err.message || 'Vote failed. Please try again.');
    } finally {
      setVotingId(null);
    }
  };

  const handleCreate = async ({ channel: ch, title, body, linkUrl }) => {
    setPosting(true);
    setError(null);
    try {
      await createPost({ channel: ch, title, body, linkUrl });
      setComposerOpen(false);
      // Re-fetch so the new post shows up under the active sort
      await fetchPage(1);
    } catch (err) {
      if (err.status === 401) {
        logout();
        return;
      }
      setError(err.message || 'Could not publish your post.');
    } finally {
      setPosting(false);
    }
  };

  /* ---------------------------------- guard --------------------------------- */

  if (!token) {
    return <AuthPage onAuthSuccess={() => onNavigate?.('/community')} onNavigate={onNavigate} />;
  }

  const channelTabs = [
    { key: 'all', label: 'All', dot: THEME.silver },
    { key: 'general', label: 'General', dot: THEME.accent },
    ...distros.map((d) => ({ key: d.id, label: d.name, dot: d.accent })),
  ];

  /* ---------------------------------- view ---------------------------------- */

  return (
    <div style={{ backgroundColor: THEME.bg, minHeight: '100vh', position: 'relative' }}>
      {/* Shared hero background texture */}
      <div className="hero-bg fixed inset-0 z-0" aria-hidden="true">
        <div className="grain-fine" />
        <div className="grain-fiber" />
      </div>

      <div
        className="relative z-10 mx-auto"
        style={{ maxWidth: 820, padding: '96px 20px 64px' }}
      >
        {/* Banner */}
        <div
          style={{
            ...GLASS,
            borderRadius: 22,
            padding: '22px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(224, 90, 56, 0.15)',
              border: '1px solid rgba(224, 90, 56, 0.4)',
            }}
          >
            <Users size={24} color={THEME.accent} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontFamily: MONO,
                fontSize: '1.3rem',
                fontWeight: 800,
                color: THEME.textMain,
                margin: 0,
                letterSpacing: '0.02em',
              }}
            >
              Community
            </h1>
            <p
              style={{
                fontFamily: MONO,
                fontSize: '0.74rem',
                color: THEME.textMuted,
                margin: '2px 0 0',
              }}
            >
              Ask, share and debate everything Linux — per-distro channels included.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setComposerOpen((v) => !v)}
            className="transition-all shrink-0"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: MONO,
              fontSize: '0.76rem',
              fontWeight: 700,
              color: '#fff',
              background: `linear-gradient(135deg, ${THEME.accent} 0%, #b83d25 100%)`,
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 9999,
              padding: '9px 18px',
              cursor: 'pointer',
              boxShadow: `0 2px 16px ${THEME.accent}55, 0 1px 0 rgba(255,255,255,0.35) inset`,
            }}
          >
            <Plus size={15} />
            Create post
          </button>
        </div>

        {/* Composer */}
        {composerOpen && (
          <div style={{ marginBottom: 18 }}>
            <Composer
              distros={distros}
              defaultChannel={channel}
              posting={posting}
              onPost={handleCreate}
              onCancel={() => setComposerOpen(false)}
            />
          </div>
        )}

        {/* Channel tabs */}
        <div
          className="flex items-center"
          style={{ gap: 8, overflowX: 'auto', paddingBottom: 10, marginBottom: 4 }}
        >
          {channelTabs.map((tab) => {
            const active = channel === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setChannel(tab.key)}
                className="px-3.5 py-1.5 rounded-full font-mono text-xs transition-all duration-200 shrink-0 select-none inline-flex items-center gap-1.5"
                style={{
                  background: active ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                  color: active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                  border: active
                    ? '1px solid rgba(255, 255, 255, 0.35)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: active
                    ? '0 2px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                    : 'none',
                  fontFamily: MONO,
                  fontSize: '0.72rem',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: tab.dot,
                    flexShrink: 0,
                  }}
                />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sort pills + search */}
        <div
          className="flex flex-wrap items-center"
          style={{ gap: 8, marginBottom: 16 }}
        >
          {SORTS.map((s) => {
            const active = sort === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                className="rounded-full font-mono transition-all duration-200 shrink-0"
                style={{
                  fontFamily: MONO,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  padding: '4px 12px',
                  background: active ? 'rgba(224, 90, 56, 0.16)' : 'transparent',
                  color: active ? THEME.accent : THEME.textMuted,
                  border: active ? `1px solid rgba(224, 90, 56, 0.45)` : `1px solid ${LINE}`,
                  cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            );
          })}
          <div style={{ flex: 1, minWidth: 160 }} />
          <div
            className="flex items-center"
            style={{
              flex: 1,
              minWidth: 200,
              maxWidth: 300,
              background: 'rgba(20, 24, 32, 0.55)',
              border: `1px solid ${LINE}`,
              borderRadius: 9999,
              padding: '5px 12px',
              gap: 8,
            }}
          >
            <Search size={14} style={{ color: THEME.textMuted, flexShrink: 0 }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search posts…"
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontFamily: MONO,
                fontSize: '0.76rem',
                color: THEME.textMain,
              }}
            />
          </div>
        </div>

        {/* Inline error */}
        {error && (
          <p
            style={{
              fontFamily: MONO,
              fontSize: '0.72rem',
              color: THEME.accent,
              textAlign: 'center',
              margin: '0 0 14px',
            }}
          >
            {error}
          </p>
        )}

        {/* Feed */}
        {loading ? (
          <p
            style={{
              fontFamily: MONO,
              fontSize: '0.78rem',
              color: THEME.textMuted,
              textAlign: 'center',
              padding: '48px 0',
            }}
          >
            Loading posts…
          </p>
        ) : posts.length === 0 ? (
          <div
            style={{
              ...GLASS,
              borderRadius: 18,
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: MONO,
                fontSize: '0.88rem',
                fontWeight: 700,
                color: THEME.textMain,
                margin: '0 0 6px',
              }}
            >
              No posts yet — start the conversation
            </p>
            <p
              style={{
                fontFamily: MONO,
                fontSize: '0.72rem',
                color: THEME.textMuted,
                margin: 0,
              }}
            >
              Hit &ldquo;Create post&rdquo; above to publish the first one.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                distro={distroMap[post.channel]}
                onOpen={(p) => onNavigate?.(`/community/${p.id}`)}
                onVote={(value) => handleVote(post, value)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {hasMore && !loading && (
          <div className="flex justify-center" style={{ marginTop: 20 }}>
            <button
              type="button"
              onClick={() => fetchPage(page + 1, { append: true })}
              disabled={loadingMore}
              className="transition-all"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: MONO,
                fontSize: '0.76rem',
                fontWeight: 700,
                color: THEME.textMain,
                background: 'rgba(255, 255, 255, 0.06)',
                border: `1px solid ${LINE_SOFT}`,
                borderRadius: 9999,
                padding: '8px 22px',
                cursor: loadingMore ? 'wait' : 'pointer',
                opacity: loadingMore ? 0.6 : 1,
              }}
            >
              {loadingMore && <Loader2 size={13} className="animate-spin" />}
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
