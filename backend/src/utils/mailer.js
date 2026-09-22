// Reset-token delivery. Two modes, selected by RESET_DELIVERY (default:
// smtp when SMTP_HOST is set, otherwise console):
// - smtp: sends via nodemailer using SMTP_HOST/PORT/SECURE/USER/PASS/FROM.
//   Works with Gmail + an App Password (host smtp.gmail.com, port 465).
// - console: prints the token to the server log (local development only).
// In production with no SMTP configured, delivery refuses loudly rather
// than silently dropping the reset.

import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return transporter;
}

export async function deliverResetToken({ email, token }) {
  const mode = (process.env.RESET_DELIVERY || (process.env.SMTP_HOST ? 'smtp' : 'console')).toLowerCase();

  if (mode === 'smtp') {
    const tx = getTransporter();
    if (!tx) {
      throw new Error('SMTP is not configured. Set SMTP_HOST/USER/PASS in backend/.env.');
    }
    await tx.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'DistroPedia password reset',
      text: [
        'Someone requested a password reset for your DistroPedia account.',
        '',
        `Your reset token (valid 15 minutes): ${token}`,
        '',
        'Paste it on the reset page with your new password. If this was not you, ignore this email.',
      ].join('\n'),
    });
    console.log(`[auth] reset email sent to ${email}`);
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Password-reset email is not configured. Set SMTP_HOST/USER/PASS in backend/.env.'
    );
  }
  console.log(`[auth] password-reset token for ${email}: ${token} (valid 15 min)`);
}
