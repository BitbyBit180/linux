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
      required: [true, 'passwordHash is required'],
    },
    name: { type: String, default: '' },
    // Admins can moderate (edit/delete) any post or comment.
    isAdmin: { type: Boolean, default: false },
    // Password-reset token (sha256 of the emailed token) + expiry.
    resetTokenHash: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

// Shape API JSON: expose `id`, hide internal/password/reset fields.
const shapeJSON = (doc, ret) => {
  ret.id = ret._id.toString();
  delete ret.passwordHash;
  delete ret.resetTokenHash;
  delete ret.resetTokenExpiry;
  delete ret._id;
  delete ret.__v;
  return ret;
};
userSchema.set('toJSON', { transform: shapeJSON });
userSchema.set('toObject', { transform: shapeJSON });

const User = mongoose.model('User', userSchema);
export default User;
