import mongoose from 'mongoose';
import Post from './Post.js';
import Comment from './Comment.js';

/**
 * `votes` collection — one vote per user per target (post or comment).
 * `value` is +1 (up) or -1 (down); removing a vote deletes the doc.
 * Target scores are kept denormalized on the target docs (see applyVote).
 */

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'user is required'],
    },
    targetType: {
      type: String,
      enum: ['post', 'comment'],
      required: [true, 'targetType is required'],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'targetId is required'],
      index: true,
    },
    value: {
      type: Number,
      enum: [1, -1],
      required: [true, 'value must be 1 or -1'],
    },
  },
  { timestamps: true }
);

// One vote per (user, targetType, targetId).
voteSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

// Shape API JSON: expose `id`, hide internals.
const shapeJSON = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};
voteSchema.set('toJSON', { transform: shapeJSON });
voteSchema.set('toObject', { transform: shapeJSON });

const Vote = mongoose.model('Vote', voteSchema);

/**
 * Apply a vote (value: 1 | -1 | 0 — 0 removes the caller's vote) and keep the
 * target's denormalized `score` in sync. Sequential writes rather than a
 * transaction — the compound unique index makes the vote write idempotent,
 * and score drift from a rare failure is self-corrected by the next vote.
 */
export const applyVote = async ({ userId, targetType, targetId, value }) => {
  if (![1, -1, 0].includes(value)) {
    const err = new Error('value must be 1, -1, or 0');
    err.statusCode = 400;
    throw err;
  }

  const Target = targetType === 'post' ? Post : Comment;
  const existing = await Vote.findOne({ user: userId, targetType, targetId });
  const existingValue = existing ? existing.value : 0;
  const delta = value - existingValue;

  if (value === 0) {
    if (existing) await existing.deleteOne();
  } else if (existing) {
    existing.value = value;
    await existing.save();
  } else {
    await Vote.create({ user: userId, targetType, targetId, value });
  }

  // Atomically move the target's score by the vote delta.
  const updated = await Target.findByIdAndUpdate(
    targetId,
    { $inc: { score: delta } },
    { new: true }
  );
  if (!updated) {
    // Target vanished — undo the vote write so no dangling vote remains.
    if (value === 0) {
      // nothing written
    } else if (existing) {
      existing.value = existingValue;
      await existing.save();
    } else {
      await Vote.deleteOne({ user: userId, targetType, targetId });
    }
    const err = new Error(
      `${targetType === 'post' ? 'Post' : 'Comment'} not found`
    );
    err.statusCode = 404;
    throw err;
  }

  return { score: updated.score, userVote: value };
};

export default Vote;
