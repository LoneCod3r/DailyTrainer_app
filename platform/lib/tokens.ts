import { randomBytes, createHash } from 'crypto';

// Verification/reset tokens: 256 bits of randomness, url-safe. Only the
// SHA-256 hash is ever persisted (see VerificationToken.tokenHash) — the raw
// value exists solely in the emailed link, so a database dump can't be
// replayed into a working token.
export function generateToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
