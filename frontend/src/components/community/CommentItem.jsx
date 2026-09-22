import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown, Minus, Plus as PlusIcon } from 'lucide-react';
import { THEME, LINE, MONO } from '../../theme/designTokens.js';
import { timeAgo } from '../../utils/timeAgo.js';
import { UserAvatar } from './Avatar.jsx';

const scoreColor = (score) => {
  if (score > 0) return THEME.accent;
  if (score < 0) return 'rgba(90, 140, 255, 0.9)';
  return THEME.silver;
};

// Small mono text action (Reply / Edit / Delete / submit / cancel)
function TextAction({ label, onClick, disabled, accent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="transition-colors"
      style={{
        fontFamily: MONO,
        fontSize: '0.66rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        background: 'none',
        border: 'none',
        padding: '2px 4px',
        borderRadius: 6,
        cursor: disabled ? 'wait' : 'pointer',
        color: accent ? THEME.accent : THEME.textMuted,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = THEME.textMain;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = accent ? THEME.accent : THEME.textMuted;
      }}
    >
      {label}
    </button>
  );
}

// Inline vote control (▲ score ▼) used within comment action rows
function InlineVote({ score, userVote, onVote, disabled = false }) {
  const voteBtn = (dir) => {
    const dirValue = dir === 'up' ? 1 : -1;
    const active = userVote === dirValue;
    return (
      <button
        type="button"
        title={dir === 'up' ? 'Upvote' : 'Downvote'}
        aria-label={`Upvote ${dir === 'down' ? 'down' : ''}comment`.trim()}
        aria-pressed={active}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          onVote?.(commentVoteValue(userVote, dir));
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 20,
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
      >
        {dir === 'up' ? (
          <ChevronUp size={13} strokeWidth={2.6} />
        ) : (
          <ChevronDown size={13} strokeWidth={2.6} />
        )}
      </button>
    );
  };
  return (
    <span className="inline-flex items-center" style={{ gap: 2 }}>
      {voteBtn('up')}
      <span
        style={{
          fontFamily: MONO,
          fontSize: '0.68rem',
          fontWeight: 800,
          color: scoreColor(score),
          minWidth: 14,
          textAlign: 'center',
        }}
      >
        {score}
      </span>
      {voteBtn('down')}
    </span>
  );
}

const commentVoteValue = (userVote, dir) => {
  const v = dir === 'up' ? 1 : -1;
  return userVote === v ? 0 : v;
};

// Shared style for the inline reply / edit textareas
const editorStyle = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 64,
  resize: 'vertical',
  background: 'rgba(20, 24, 32, 0.6)',
  border: `1px solid ${LINE}`,
  borderRadius: 10,
  outline: 'none',
  padding: '8px 10px',
  fontFamily: MONO,
  fontSize: '0.78rem',
  lineHeight: 1.6,
  color: THEME.textMain,
};

/**
 * One node of the comment tree (recurses into `comment.replies`).
 * Reddit-style: avatar, author · time, body, horizontal action row,
 * collapse toggle on the thread line. Body is plain text (pre-wrap).
 */
export default function CommentItem({
  comment,
  user,
  onVote,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
  voteDisabled = false,
}) {
  const isOwner = user?.id !== undefined && comment.author?.id === user.id;

  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const replyRef = useRef(null);
  const editRef = useRef(null);

  useEffect(() => {
    if (replying) replyRef.current?.focus();
  }, [replying]);
  useEffect(() => {
    if (editing) editRef.current?.focus();
  }, [editing]);

  const submitReply = () => {
    const body = replyDraft.trim();
    if (!body) return;
    onReply?.(body, comment.id);
    setReplyDraft('');
    setReplying(false);
  };

  const submitEdit = () => {
    const body = editDraft.trim();
    if (!body) return;
    onEdit?.(comment.id, body);
    setEditing(false);
  };

  return (
    <div style={{ paddingLeft: depth > 0 ? 14 : 0 }}>
      <div
        style={{
          borderLeft: depth > 0 ? `1px solid ${LINE}` : 'none',
          paddingLeft: depth > 0 ? 12 : 0,
          marginLeft: 2,
        }}
      >
        {/* Header: collapse toggle + avatar + author · time + inline votes */}
        <div className="flex items-center" style={{ gap: 8, padding: '8px 0 2px' }}>
          {depth > 0 || comment.replies?.length > 0 ? (
            <button
              type="button"
              title={collapsed ? 'Expand thread' : 'Collapse thread'}
              onClick={() => setCollapsed((v) => !v)}
              className="flex items-center justify-center shrink-0"
              style={{
                width: 18,
                height: 18,
                borderRadius: 9999,
                border: `1px solid ${LINE}`,
                background: 'transparent',
                color: THEME.textMuted,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {collapsed ? <PlusIcon size={11} /> : <Minus size={11} />}
            </button>
          ) : null}
          <UserAvatar name={comment.author?.name} size={26} />
          <span
            style={{
              fontFamily: MONO,
              fontSize: '0.72rem',
              fontWeight: 700,
              color: THEME.textMain,
            }}
          >
            u/{comment.author?.name || 'unknown'}
          </span>
          <span style={{ color: THEME.textMuted, fontSize: '0.6rem' }}>•</span>
          <span style={{ fontFamily: MONO, fontSize: '0.64rem', color: THEME.textMuted }}>
            {timeAgo(comment.createdAt)}
          </span>
          <InlineVote
            score={comment.score}
            userVote={comment.userVote}
            onVote={(v) => onVote?.(comment.id, v)}
            disabled={voteDisabled}
          />
        </div>

        {/* Body / replies — hidden while collapsed */}
        {collapsed ? (
          <p
            style={{
              margin: '0 0 4px',
              fontFamily: MONO,
              fontSize: '0.64rem',
              color: THEME.textMuted,
              fontStyle: 'italic',
            }}
          >
            collapsed
          </p>
        ) : (
          <>
            {/* Body (plain text) or edit textarea */}
            {editing ? (
              <div style={{ marginTop: 6, maxWidth: 720 }}>
                <textarea
                  ref={editRef}
                  rows={3}
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  style={editorStyle}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <TextAction label="Save" accent disabled={!editDraft.trim()} onClick={submitEdit} />
                  <TextAction
                    label="Cancel"
                    onClick={() => {
                      setEditing(false);
                      setEditDraft('');
                    }}
                  />
                </div>
              </div>
            ) : (
              <p
                style={{
                  margin: '2px 0 0',
                  fontFamily: MONO,
                  fontSize: '0.78rem',
                  lineHeight: 1.65,
                  color: THEME.textMain,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                {comment.body}
              </p>
            )}

            {/* Actions */}
            {!editing && (
              <div className="flex items-center" style={{ gap: 4, marginTop: 4 }}>
                <TextAction
                  label="Reply"
                  accent={replying}
                  onClick={() => {
                    setReplying((v) => !v);
                    setReplyDraft('');
                  }}
                />
                {isOwner && (
                  <>
                    <TextAction
                      label="Edit"
                      onClick={() => {
                        setEditDraft(comment.body || '');
                        setEditing(true);
                      }}
                    />
                    <TextAction label="Delete" onClick={() => onDelete?.(comment.id)} />
                  </>
                )}
              </div>
            )}

            {/* Inline reply form */}
            {replying && (
              <div style={{ marginTop: 8, maxWidth: 720 }}>
                <textarea
                  ref={replyRef}
                  rows={3}
                  placeholder={`Reply to u/${comment.author?.name || 'unknown'}…`}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  style={editorStyle}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <TextAction
                    label="Submit reply"
                    accent
                    disabled={!replyDraft.trim()}
                    onClick={submitReply}
                  />
                  <TextAction
                    label="Cancel"
                    onClick={() => {
                      setReplying(false);
                      setReplyDraft('');
                    }}
                  />
                </div>
              </div>
            )}

            {/* Replies */}
            {comment.replies?.length > 0 && (
              <div style={{ marginTop: 6 }}>
                {comment.replies.map((r) => (
                  <CommentItem
                    key={r.id}
                    comment={r}
                    user={user}
                    onVote={onVote}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    depth={depth + 1}
                    voteDisabled={voteDisabled}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
