import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unit tests for the NextAuth jwt/session callbacks in lib/auth.ts, with only
// the DB boundary mocked. Invalidation contract (next-auth 4.24.x): the jwt
// callback throws, which the session route turns into "no session".
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: vi.fn(), update: vi.fn() } } }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(() => true) }));

const { prisma } = await import('@/lib/prisma');
const { authOptions } = await import('@/lib/auth');

const jwt = authOptions.callbacks!.jwt!;
const sessionCb = authOptions.callbacks!.session!;

const baseToken = {
  id: 'u1',
  role: 'ADMIN',
  status: 'ACTIVE',
  emailVerified: null,
  name: 'Ada',
  email: 'ada@example.dev',
} as any;

function runJwt(token = { ...baseToken }) {
  return (jwt as any)({ token });
}
function dbReturns(row: unknown) {
  (prisma.user.findUnique as any).mockResolvedValue(row);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('jwt callback — session revocation', () => {
  it('ACTIVE user: returns the token with claims refreshed from the DB', async () => {
    const verified = new Date();
    dbReturns({ role: 'MODERATOR', status: 'ACTIVE', emailVerified: verified });

    const result = await runJwt();

    expect(result).toMatchObject({
      id: 'u1',
      role: 'MODERATOR',
      status: 'ACTIVE',
      emailVerified: verified,
      email: 'ada@example.dev',
    });
  });

  it('SUSPENDED user: throws', async () => {
    dbReturns({ role: 'ADMIN', status: 'SUSPENDED', emailVerified: null });
    await expect(runJwt()).rejects.toThrow('SESSION_REVOKED');
  });

  it('INACTIVE user: throws', async () => {
    dbReturns({ role: 'ADMIN', status: 'INACTIVE', emailVerified: null });
    await expect(runJwt()).rejects.toThrow('SESSION_REVOKED');
  });

  it('deleted user (lookup returns null): throws', async () => {
    dbReturns(null);
    await expect(runJwt()).rejects.toThrow('SESSION_REVOKED');
  });

  it('database error propagates unchanged', async () => {
    const dbError = new Error('connection refused');
    (prisma.user.findUnique as any).mockRejectedValue(dbError);
    await expect(runJwt()).rejects.toBe(dbError);
  });

  it('fresh sign-in (user present) skips the DB lookup', async () => {
    const result = await (jwt as any)({
      token: {},
      user: { id: 'u2', role: 'USER', status: 'ACTIVE', emailVerified: null },
    });
    expect(result).toMatchObject({ id: 'u2', role: 'USER', status: 'ACTIVE' });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('session callback — fail closed', () => {
  const baseSession = () => ({ user: { name: 'Ada', email: 'ada@example.dev' }, expires: 'x' }) as any;

  it('valid token: populates the session user', async () => {
    const result: any = await (sessionCb as any)({ session: baseSession(), token: baseToken });
    expect(result.user).toMatchObject({ id: 'u1', role: 'ADMIN', status: 'ACTIVE' });
  });

  it.each([
    ['empty token', {}],
    ['missing id', { role: 'ADMIN', status: 'ACTIVE' }],
    ['missing role', { id: 'u1', status: 'ACTIVE' }],
    ['null token', null],
  ])('%s: throws instead of returning a partial session', async (_name, token) => {
    await expect((sessionCb as any)({ session: baseSession(), token })).rejects.toThrow('SESSION_INVALID');
  });
});
