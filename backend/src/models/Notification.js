import mongoose from 'mongoose';

/**
 * `notifications` — "someone replied to you" for the community. Written on
 * comment creation for the post author and (for replies) the parent comment
 * author, excluding self-notifies. Recipients pull their own feed; nothing
 * is pushed.
 */

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'type is required'],
      enum: ['reply', 'comment'],
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'actor is required'],
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'post is required'],
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const shapeJSON = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};
notificationSchema.set('toJSON', { transform: shapeJSON });
notificationSchema.set('toObject', { transform: shapeJSON });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
