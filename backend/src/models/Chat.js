import mongoose from 'mongoose';

/**
 * `chats` collection — AI assistant conversations.
 * Each chat belongs to a user and holds an ordered message list;
 * assistant messages may carry the sources (Reddit / web) they used.
 */

const sourceSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: { type: String, default: '' },
    sources: { type: [sourceSchema], default: [] },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, default: 'New chat' },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

// Shape API JSON: expose `id`, hide owner/internals.
const shapeJSON = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret.user;
  delete ret._id;
  delete ret.__v;
  return ret;
};
chatSchema.set('toJSON', { transform: shapeJSON });
chatSchema.set('toObject', { transform: shapeJSON });

const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
