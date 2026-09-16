import mongoose from 'mongoose';

/**
 * `comments` collection — threaded comments on community posts.
 * `parent` null = top-level comment; set = reply to that comment.
 * score is kept denormalized via Vote.applyVote.
 */

const commentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'post is required'],
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'author is required'],
      index: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true,
    },
    body: {
      type: String,
      required: [true, 'body is required'],
      trim: true,
      maxlength: [5000, 'body cannot exceed 5000 characters'],
    },
    score: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

// Shape API JSON: expose `id`, hide internals.
const shapeJSON = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};
commentSchema.set('toJSON', { transform: shapeJSON });
commentSchema.set('toObject', { transform: shapeJSON });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
