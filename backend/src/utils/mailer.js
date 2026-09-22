// Reset-token delivery. No SMTP dependency is bundled: in production set
// RESET_DELIVERY=console (dev default — token goes to the server log) or
// implement an SMTP/API sender here behind RESET_DELIVERY=smtp and call it
// from the auth controller. The interface stays the same either way.

export async function deliverResetToken({ email, token }) {
  const mode = (process.env.RESET_DELIVERY || 'console').toLowerCase();
  if (mode === 'console' || process.env.NODE_ENV !== 'production') {
    console.log(`[auth] password-reset token for ${email}: ${token} (valid 15 min)`);
    return;
  }
  // Production without a configured sender: refuse loudly rather than
  // silently dropping the reset.
  throw new Error(
    'Password-reset email is not configured. Set RESET_DELIVERY=console or add an SMTP sender in src/utils/mailer.js.'
  );
}
