import mongoose from 'mongoose';

/**
 * `reports` — user-driven moderation flags on posts/comments. One report
 * per user per target (unique index) so pile-ons can't skew the queue.
 * Admins triage via status: open → resolved (action taken) / dismissed.
 */

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'reporter is required'],
      index: true,
    },
    targetType: {
      type: String,
      required: [true, 'targetType is required'],
      enum: ['post', 'comment'],
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'targetId is required'],
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'reason is required'],
      enum: ['spam', 'harassment', 'off-topic', 'wrong-channel', 'other'],
    },
    detail: { type: String, default: '', maxlength: [500, 'detail is too long'] },
    status: {
      type: String,
      default: 'open',
      enum: ['open', 'resolved', 'dismissed'],
      index: true,
    },
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });

const shapeJSON = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};
reportSchema.set('toJSON', { transform: shapeJSON });
reportSchema.set('toObject', { transform: shapeJSON });

const Report = mongoose.model('Report', reportSchema);
export default Report;
