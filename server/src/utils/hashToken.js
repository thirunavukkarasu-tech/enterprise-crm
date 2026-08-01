import crypto from 'crypto';

/**
 * SHA-256 hash of a raw token string. Used to store/compare refresh tokens
 * and password-reset tokens without ever persisting the raw, usable value —
 * the same principle as bcrypt for passwords, but a plain fast hash is
 * appropriate here since these tokens are already high-entropy random
 * strings (unlike user-chosen passwords, they don't need slow hashing).
 */
export const hashToken = (rawToken) => crypto.createHash('sha256').update(rawToken).digest('hex');
