import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const isSmtpConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    })
  : null;

/**
 * Sends the password-reset email. Falls back to logging the reset link to
 * the console when SMTP credentials aren't configured — this keeps the
 * forgot-password flow fully testable in local/portfolio environments
 * without requiring a real mail provider, while using a real transporter
 * whenever one is configured (see server/.env.example).
 */
export const sendPasswordResetEmail = async ({ to, resetUrl }) => {
  const subject = 'Reset your CRM Platform password';
  const text = `You requested a password reset. This link expires in ${env.resetTokenExpiresMinutes} minutes:\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `
    <p>You requested a password reset. This link expires in <strong>${env.resetTokenExpiresMinutes} minutes</strong>.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `;

  if (!transporter) {
    // eslint-disable-next-line no-console
    console.log(`\n[email:dev-fallback] SMTP not configured. Reset link for ${to}:\n${resetUrl}\n`);
    return;
  }

  await transporter.sendMail({ from: env.smtp.from, to, subject, text, html });
};
