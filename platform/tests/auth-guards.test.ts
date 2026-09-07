import { describe, it, expect } from 'vitest';
import { requireVerifiedUser } from '@/lib/auth-guards';

describe('requireVerifiedUser', () => {
  it('throws a 403 EMAIL_NOT_VERIFIED error when emailVerified is null', () => {
    expect(() => requireVerifiedUser({ emailVerified: null })).toThrowError(
      expect.objectContaining({ status: 403, code: 'EMAIL_NOT_VERIFIED' }),
    );
  });

  it('throws when the user itself is missing (no session)', () => {
    expect(() => requireVerifiedUser(null)).toThrowError(expect.objectContaining({ status: 403 }));
  });

  it('does not throw when emailVerified is set', () => {
    expect(() => requireVerifiedUser({ emailVerified: new Date() })).not.toThrow();
  });
});
