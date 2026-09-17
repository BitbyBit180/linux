import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import AuthPage from './AuthPage.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useDistros } from '../hooks/useDistros.js';
import { THEME, LINE, LINE_SOFT, MONO } from '../theme/designTokens.js';
import PostCard from '../components/community/PostCard.jsx';
import CommunityShell from '../components/community/CommunityShell.jsx';
import { RailCard } from '../components/community/CommunityShell.jsx';
import CommunityNav from '../components/community/CommunityNav.jsx';
import {
  RecentPosts,
} from '../components/community/CommunitySidebar.jsx';
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
  const [showLink, setShowLink] = useState(false);
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
    <div className="dp-fade" style={{ ...GLASS, borderRadius: 18, padding: 16, marginBottom: 18 }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
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

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What do you want to share? (optional — markdown works)"
        rows={4}
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
          marginBottom: 10,
        }}
      />

      {/* Bottom row: channel + optional link toggle + actions */}
      <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
        <select
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
          style={{
            fontFamily: MONO,
            fontSize: '0.74rem',
            color: THEME.textMain,
            background: 'rgba(20, 24, 32, 0.6)',
            border: `1px solid ${LINE}`,
            borderRadius: 9999,
            padding: '6px 10px',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="general">General</option>
          {distros.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {!showLink && (
          <button
            type="button"
            onClick={() => setShowLink(true)}
            className="transition-colors"
            style={{
              fontFamily: MONO,
              fontSize: '0.72rem',
              color: THEME.textMuted,
              background: 'none',
              border: `1px dashed ${LINE}`,
              borderRadius: 9999,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = THEME.textMain;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = THEME.textMuted;
            }}
          >
            + Add link
          </button>
        )}

        <div style={{ flex: 1 }} />
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

      {showLink && (
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="Link URL (https://…)"
          autoFocus
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
            marginTop: 10,
          }}
        />
      )}

      {localError && (
        <p
          style={{
            margin: '10px 0 0',
            fontFamily: MONO,
            fontSize: '0.7rem',
            color: THEME.accent,
          }}
        >
          {localError}
        </p>
      )}
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

  const handleDeletePost = async (post) => {
    // Deleting from the feed isn't offered — the card routes to the detail
    // page where the confirm dialog lives. Kept for prop symmetry.
    onNavigate?.(`/community/${post.id}`);
  };

  /* ---------------------------------- guard --------------------------------- */

  if (!token) {
    return <AuthPage onAuthSuccess={() => onNavigate?.('/community')} onNavigate={onNavigate} />;
  }

  const activeChannelLabel =
    channel === 'all' ? null : channel === 'general' ? 'General' : distroMap[channel]?.name;

  /* ---------------------------------- view ---------------------------------- */

  return (
    <CommunityShell
      nav={
        <CommunityNav
          distros={distros}
          channel={channel}
          onNavigate={onNavigate}
          onChannel={(k) => setChannel(k)}
          onCreatePost={() => setComposerOpen(true)}
        />
      }
      rail={
        <>
          <RecentPosts onOpen={(p) => onNavigate?.(`/community/${p.id}`)} />
        </>
      }
    >
      {/* Channel context (only when a specific channel is active) */}
      {activeChannelLabel && (
        <div
          style={{
            fontFamily: MONO,
            fontSize: '0.7rem',
            color: THEME.textMuted,
            margin: '2px 0 10px',
          }}
        >
          Browsing channel: <span style={{ color: THEME.textMain }}>{activeChannelLabel}</span>
        </div>
      )}

      {/* Composer */}
      {composerOpen && (
        <Composer
          distros={distros}
          defaultChannel={channel}
          posting={posting}
          onPost={handleCreate}
          onCancel={() => setComposerOpen(false)}
        />
      )}

      {/* Sort pills + search */}
      <div className="flex flex-wrap items-center" style={{ gap: 8, marginBottom: 14 }}>
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
        <div style={{ flex: 1, minWidth: 60 }} />
        <div
          className="flex items-center"
          style={{
            flex: 1,
            minWidth: 180,
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

      {/* Feed: flat rows inside one glass panel (Reddit list style) */}
      <div style={{ ...GLASS, borderRadius: 18, padding: '6px 18px 2px' }}>
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
          <div style={{ padding: '42px 16px', textAlign: 'center' }}>
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
              Hit &ldquo;Create post&rdquo; to publish the first one.
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              distro={distroMap[post.channel]}
              onOpen={(p) => onNavigate?.(`/community/${p.id}`)}
              onVote={(value) => handleVote(post, value)}
              isOwner={false}
              onDelete={handleDeletePost}
            />
          ))
        )}
      </div>

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
    </CommunityShell>
  );
}
