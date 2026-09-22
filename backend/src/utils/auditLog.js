import AuditLog from '../models/AuditLog.js';

// Record an admin action on someone else's content. Fire-and-forget: audit
// writes must never fail the admin's own request, so errors are swallowed.
export function logAdminAction({ actorId, action, targetType, targetId, detail = '' }) {
  if (!actorId || !action || !targetType || !targetId) return;
  AuditLog.create({ actor: actorId, action, targetType, targetId, detail }).catch(() => {});
}

// True when the caller is an admin acting on content they don't own —
// the only case worth auditing (own edits/deletes are ordinary actions).
export function isAdminOnOthersContent(user, ownerId) {
  if (!user?.isAdmin) return false;
  try {
    if (ownerId?.equals) return !ownerId.equals(user._id);
    return String(ownerId) !== String(user._id);
  } catch {
    return true;
  }
}
