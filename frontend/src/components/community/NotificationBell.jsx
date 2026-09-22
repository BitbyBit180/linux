import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { THEME, LINE, MONO } from '../../theme/designTokens.js';
import { timeAgo } from '../../utils/timeAgo.js';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/communityApi.js';

/**
 * Notification bell with unread badge + dropdown. Polls every 30s.
 * `onOpenPost(postId)` navigates to the post (marks the item read first).
 */
export default function NotificationBell({ onOpenPost }) {
  const [notes, setNotes] = useState([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getNotifications({ page: 1, limit: 8 });
      setNotes(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      /* silent — bell just stays empty offline */
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open ]);

  const handleOpen = async (n) => {
    setOpen(false);
    if (!n.read) {
      setUnread((u) => Math.max(0, u - 1));
      setNotes((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      try {
        await markNotificationRead(n.id);
      } catch {
        /* revert on failure */
        refresh();
        return;
      }
    }
    onOpenPost?.(n.post?.id || n.post);
  };

  const handleReadAll = async () => {
    try {
      await markAllNotificationsRead();
      setUnread(0);
      setNotes((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
      /* silent */
    }
  };

  const label = (n) =>
    n.type === 'reply'
      ? `replied to you`
      : `commented on your post`;

  return (
    <div ref={rootRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        type="button"
        title="Notifications"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center transition-colors"
        style={{
          width: 32,
          height: 32,
          borderRadius: 9999,
          border: `1px solid ${LINE}`,
          background: open ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          color: unread ? THEME.textMain : THEME.textMuted,
          cursor: 'pointer',
        }}
      >
        <Bell size={15} />
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: 9999,
              background: THEME.accent,
              color: '#fff',
              fontFamily: MONO,
              fontSize: '0.58rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 'min(320px, calc(100vw - 48px))',
            maxHeight: 380,
            overflowY: 'auto',
            zIndex: 80,
            borderRadius: 14,
            background: 'rgba(22, 27, 34, 0.95)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: `1px solid ${LINE}`,
            boxShadow: '0 18px 50px rgba(0,0,0,0.5)',
            padding: 6,
          }}
        >
          <div
            className="flex items-center justify-between"
            style={{ padding: '6px 8px' }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: THEME.textMuted,
              }}
            >
              Notifications
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleReadAll}
                className="inline-flex items-center transition-colors"
                style={{
                  gap: 4,
                  background: 'none',
                  border: 'none',
                  fontFamily: MONO,
                  fontSize: '0.64rem',
                  color: THEME.accent,
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>
          {notes.length === 0 && (
            <p
              style={{
                fontFamily: MONO,
                fontSize: '0.7rem',
                color: THEME.textMuted,
                textAlign: 'center',
                padding: '18px 8px',
                margin: 0,
              }}
            >
              No notifications yet.
            </p>
          )}
          {notes.map((n, i) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleOpen(n)}
              className="w-full text-left transition-colors"
              style={{
                display: 'block',
                background: n.read ? 'transparent' : 'rgba(224, 90, 56, 0.07)',
                border: 'none',
                borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
                borderRadius: 8,
                padding: '9px 10px',
                cursor: 'pointer',
                fontFamily: MONO,
              }}
            >
              <div style={{ fontSize: '0.72rem', color: THEME.textMain, lineHeight: 1.5 }}>
                <span style={{ fontWeight: 800 }}>u/{n.actor?.name || 'someone'}</span>{' '}
                {label(n)}
              </div>
              <div
                style={{
                  fontSize: '0.68rem',
                  color: THEME.silver,
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.post?.title || 'your post'}
              </div>
              <div style={{ fontSize: '0.6rem', color: THEME.textMuted, marginTop: 2 }}>
                {timeAgo(n.createdAt)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
