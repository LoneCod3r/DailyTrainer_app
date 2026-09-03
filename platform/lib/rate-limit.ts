// Minimal in-memory rate limiter for the Foundation Phase.
//
// Good enough for a single-instance dev/staging deployment (e.g. login,
// register, webhook abuse). Once the app runs on multiple instances, swap
// the Map below for a shared store (Redis/Upstash) behind this same
// `checkRateLimit` signature — call sites do not need to change.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count += 1;
  return true;
}
