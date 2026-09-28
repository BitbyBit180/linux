import mongoose from 'mongoose';

/**
 * `users` collection — accounts for the AI Linux assistant.
 * Passwords are stored as bcrypt hashes (never plaintext, never in JSON).
 */

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null, // null for Google-only accounts (no password set)
    },
    name: { type: String, default: '' },
    // Admins can moderate (edit/delete) any post or comment.
    isAdmin: { type: Boolean, default: false },
    // Google account id (sub) for Sign in with Google. Unique + sparse so
    // password-only accounts (no googleId) never collide on null.
    googleId: { type: String, default: null, unique: true, sparse: true, index: true },
    // Password-reset token (sha256 of the emailed token) + expiry.
    resetTokenHash: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Shape API JSON: expose `id`, hide internal/password/reset fields.
// googleId stays hidden (account-linking identifier, not public).
const shapeJSON = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret.passwordHash;
  delete ret.resetTokenHash;
  delete ret.resetTokenExpiry;
  delete ret.googleId;
  delete ret._id;
  delete ret.__v;
  return ret;
};
userSchema.set('toJSON', { transform: shapeJSON });
userSchema.set('toObject', { transform: shapeJSON });

const User = mongoose.model('User', userSchema);
export default User;
