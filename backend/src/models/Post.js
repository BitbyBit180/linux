import mongoose from 'mongoose';

/**
 * `posts` collection — community posts, scoped to a channel.
 * A channel is either 'general' or a distro slug (`distroId` from the
 * `flavours` catalogue). score is kept denormalized via Vote.applyVote.
 */

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'author is required'],
      index: true,
    },
    channel: {
      type: String,
      required: [true, 'channel is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      maxlength: [150, 'title cannot exceed 150 characters'],
    },
    body: {
      type: String,
      default: '',
      maxlength: [10000, 'body cannot exceed 10000 characters'],
    },
    linkUrl: { type: String, default: '' },
    score: { type: Number, default: 0, index: true },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index so ?search= can match post titles.
postSchema.index({ title: 'text' });

// Feed filters always scope by channel first, then sort by recency (new)
// or score (top), or compute hotScore over the channel slice (hot) —
// compound indexes keep those slices fast as the collection grows.
postSchema.index({ channel: 1, createdAt: -1 });
postSchema.index({ channel: 1, score: -1 });

// Shape API JSON: expose `id`, hide internals. `author` stays as-is —
// the controller populates it (User's own transform then applies).
const shapeJSON = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret._id;
  delete ret.__v;
  return ret;
};
postSchema.set('toJSON', { transform: shapeJSON });
postSchema.set('toObject', { transform: shapeJSON });

const Post = mongoose.model('Post', postSchema);
export default Post;
