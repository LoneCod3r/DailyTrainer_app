import { describe, it, expect } from 'vitest';
import { hasRole, isAdmin, isModerator, roleLevel } from '@/lib/permissions';

describe('permissions', () => {
  it('orders roles by privilege', () => {
    expect(roleLevel('USER')).toBeLessThan(roleLevel('MODERATOR'));
    expect(roleLevel('MODERATOR')).toBeLessThan(roleLevel('ADMIN'));
  });

  it('hasRole returns true when role meets or exceeds the requirement', () => {
    expect(hasRole('ADMIN', 'MODERATOR')).toBe(true);
    expect(hasRole('MODERATOR', 'MODERATOR')).toBe(true);
    expect(hasRole('USER', 'MODERATOR')).toBe(false);
  });

  it('hasRole returns false for null/undefined role', () => {
    expect(hasRole(null, 'USER')).toBe(false);
    expect(hasRole(undefined, 'USER')).toBe(false);
  });

  it('isAdmin/isModerator convenience helpers', () => {
    expect(isAdmin('ADMIN')).toBe(true);
    expect(isAdmin('MODERATOR')).toBe(false);
    expect(isModerator('ADMIN')).toBe(true);
    expect(isModerator('USER')).toBe(false);
  });
});
