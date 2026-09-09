import { describe, it, expect } from 'vitest';
import { requireVerifiedUser, requireRole, forbidModeratorFinancialAccess } from '@/lib/auth-guards';

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

describe('requireRole', () => {
  it('throws a 403 when role is below the requirement', () => {
    expect(() => requireRole('USER', 'MODERATOR')).toThrowError(expect.objectContaining({ status: 403 }));
  });

  it('does not throw when role meets or exceeds the requirement', () => {
    expect(() => requireRole('MODERATOR', 'MODERATOR')).not.toThrow();
    expect(() => requireRole('ADMIN', 'MODERATOR')).not.toThrow();
  });
});

// Moderator is project/community staff, not a customer — this guard is what
// blocks the normal-customer financial self-service API routes (membership
// subscribe/portal, donation checkout) for Moderator specifically, without
// affecting Admin. See lib/permissions.ts's isModeratorOnly.
describe('forbidModeratorFinancialAccess', () => {
  it('throws a 403 for MODERATOR', () => {
    expect(() => forbidModeratorFinancialAccess('MODERATOR')).toThrowError(expect.objectContaining({ status: 403 }));
  });

  it('does not throw for ADMIN or USER', () => {
    expect(() => forbidModeratorFinancialAccess('ADMIN')).not.toThrow();
    expect(() => forbidModeratorFinancialAccess('USER')).not.toThrow();
  });

  it('does not throw for null/undefined role (a separate unauthorized check handles that)', () => {
    expect(() => forbidModeratorFinancialAccess(null)).not.toThrow();
    expect(() => forbidModeratorFinancialAccess(undefined)).not.toThrow();
  });
});
