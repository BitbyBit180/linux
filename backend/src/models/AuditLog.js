import mongoose from 'mongoose';

/**
 * `auditlogs` — who did what to whose content. Written whenever an admin
 * acts on content they don't own (edit/delete post or comment), so a
 * disputed removal can always be traced back. Append-only: no update or
 * delete endpoint exists on purpose.
 */

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'actor is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'action is required'],
      enum: ['post.update', 'post.delete', 'comment.update', 'comment.delete'],
      index: true,
    },
    targetType: {
      type: String,
      required: [true, 'targetType is required'],
      enum: ['post', 'comment'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'targetId is required'],
      index: true,
    },
    // Snapshot for context after the target row is gone (title/body excerpt).
    detail: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const shapeJSON = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};
auditLogSchema.set('toJSON', { transform: shapeJSON });
auditLogSchema.set('toObject', { transform: shapeJSON });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
