import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { THEME, LINE, MONO } from '../../theme/designTokens.js';
import { timeAgo } from '../../utils/timeAgo.js';

const scoreColor = (score) => {
  if (score > 0) return THEME.accent;
  if (score < 0) return 'rgba(90, 140, 255, 0.9)';
  return THEME.silver;
};

// Small mono text action (Reply / Edit / Delete / submit / cancel)
function TextAction({ label, onClick, disabled, danger, accent }) {
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
        color: accent ? THEME.accent : danger ? THEME.textMuted : THEME.textMuted,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = danger ? THEME.accent : THEME.textMain;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = accent ? THEME.accent : THEME.textMuted;
      }}
    >
      {label}
    </button>
  );
}

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
 * Body is plain text (pre-wrap) — comments are not markdown.
 * The parent owns the comment state; we only fire intents.
 */
export default function CommentItem({
  comment,
  user,
  onVote,
  onReply,
  onEdit,
  onDelete,
  depth = 0,
}) {
  const isOwner = user?.id !== undefined && comment.author?.id === user.id;

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
      {/* Thread line for nested replies */}
      {depth > 0 && (
        <div
          style={{
            borderLeft: `1px solid ${LINE}`,
            paddingLeft: 12,
            marginLeft: 2,
          }}
        >
          <CommentInner />
        </div>
      )}
      {depth === 0 && <CommentInner />}
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
            />
          ))}
        </div>
      )}
    </div>
  );

  function CommentInner() {
    return (
      <div className="dp-fade" style={{ padding: '8px 0 2px' }}>
        {/* Header: author · time · inline vote controls */}
        <div className="flex flex-wrap items-center" style={{ gap: 8 }}>
          <span
            style={{
              fontFamily: MONO,
              fontSize: '0.74rem',
              fontWeight: 700,
              color: THEME.textMain,
            }}
          >
            u/{comment.author?.name || 'unknown'}
          </span>
          <span style={{ fontFamily: MONO, fontSize: '0.66rem', color: THEME.textMuted }}>
            {timeAgo(comment.createdAt)}
          </span>
          {/* Inline vote controls */}
          <span className="inline-flex items-center" style={{ gap: 2, marginLeft: 4 }}>
            <button
              type="button"
              title="Upvote"
              aria-label="Upvote comment"
              onClick={() => onVote?.(comment.id, comment.userVote === 1 ? 0 : 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 18,
                borderRadius: 6,
                border: 'none',
                background: comment.userVote === 1 ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: comment.userVote === 1 ? scoreColor(1) : THEME.textMuted,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ChevronUp size={13} strokeWidth={2.6} />
            </button>
            <span
              style={{
                fontFamily: MONO,
                fontSize: '0.68rem',
                fontWeight: 800,
                color: scoreColor(comment.score),
                minWidth: 14,
                textAlign: 'center',
              }}
            >
              {comment.score}
            </span>
            <button
              type="button"
              title="Downvote"
              aria-label="Downvote comment"
              onClick={() => onVote?.(comment.id, comment.userVote === -1 ? 0 : -1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 20,
                height: 18,
                borderRadius: 6,
                border: 'none',
                background: comment.userVote === -1 ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: comment.userVote === -1 ? scoreColor(-1) : THEME.textMuted,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <ChevronDown size={13} strokeWidth={2.6} />
            </button>
          </span>
        </div>

        {/* Body (plain text) or edit textarea */}
        {editing ? (
          <div style={{ marginTop: 6 }}>
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
              margin: '4px 0 0',
              fontFamily: MONO,
              fontSize: '0.8rem',
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
                <TextAction label="Delete" danger onClick={() => onDelete?.(comment.id)} />
              </>
            )}
          </div>
        )}

        {/* Inline reply form */}
        {replying && (
          <div style={{ marginTop: 8 }}>
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
      </div>
    );
  }
}
