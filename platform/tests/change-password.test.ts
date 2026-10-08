import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

// Signed-in password change, end to end through the real pieces: the
// POST /api/account/password handler, changePasswordSchema, changePassword()
// (real bcrypt), and the real NextAuth authorize/jwt callbacks for "old
// password no longer works / new one does / other sessions are revoked".
// Only the session lookup and the database are mocked — the database as a
// single in-memory user row, so what the change writes is what login reads.

type Row = {
  id: string;
  email: string;
  name: string;
  role: 'USER';
  status: 'ACTIVE';
  emailVerified: Date | null;
  passwordHash: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
};
let row: Row;

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id?: string; email?: string } }) =>
        (where.id && where.id === row.id) || (where.email && where.email === row.email) ? { ...row } : null,
      ),
      update: vi.fn(async ({ data }: { data: Partial<Row> }) => {
        row = { ...row, ...data };
        return { ...row };
      }),
    },
  },
}));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));

const { prisma } = await import('@/lib/prisma');
const { getServerSession } = await import('next-auth');
const { POST } = await import('@/app/api/account/password/route');
const { changePassword } = await import('@/modules/auth/auth.service');
const { changePasswordSchema } = await import('@/lib/validations/auth');
const { authOptions, passwordFingerprint } = await import('@/lib/auth');

const OLD = 'old-password-123';
const NEW = 'new-password-456';

const authorize = (authOptions.providers[0] as any).options.authorize as (
  creds: { email: string; password: string },
  req: unknown,
) => Promise<any>;
const jwt = authOptions.callbacks!.jwt! as (args: any) => Promise<any>;

let userCounter = 0;
async function freshUser() {
  // A distinct id per test keeps the per-user rate limit (in-memory) from
  // leaking between tests.
  userCounter += 1;
  row = {
    id: `u-change-${userCounter}`,
    email: `user${userCounter}@example.dev`,
    name: 'Test User',
    role: 'USER',
    status: 'ACTIVE',
    emailVerified: new Date(),
    passwordHash: await bcrypt.hash(OLD, 4),
    failedLoginAttempts: 0,
    lockedUntil: null,
  };
  (getServerSession as any).mockResolvedValue({ user: { id: row.id, email: row.email, role: 'USER' } });
}

function post(body: unknown) {
  return POST(
    new Request('http://localhost/api/account/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

function login(password: string) {
  return authorize({ email: row.email, password }, { headers: { 'x-forwarded-for': `198.51.100.${userCounter}` } });
}

beforeEach(async () => {
  vi.clearAllMocks();
  await freshUser();
});

describe('changePasswordSchema', () => {
  const base = { currentPassword: OLD, newPassword: NEW, confirmPassword: NEW };

  it('accepts a valid change', () => {
    expect(changePasswordSchema.safeParse(base).success).toBe(true);
  });

  it('rejects mismatched new passwords', () => {
    const r = changePasswordSchema.safeParse({ ...base, confirmPassword: 'something-else' });
    expect(r.success).toBe(false);
    expect(r.error!.flatten().fieldErrors.confirmPassword).toContain('PASSWORD_MISMATCH');
  });

  it('applies the registration password rule (too short / too long)', () => {
    const short = changePasswordSchema.safeParse({ ...base, newPassword: 'short', confirmPassword: 'short' });
    expect(short.success).toBe(false);
    expect(short.error!.flatten().fieldErrors.newPassword?.[0]).toMatch(/at least 8/);

    const long = 'x'.repeat(73);
    const tooLong = changePasswordSchema.safeParse({ ...base, newPassword: long, confirmPassword: long });
    expect(tooLong.success).toBe(false);
    expect(tooLong.error!.flatten().fieldErrors.newPassword?.[0]).toMatch(/at most 72/);
  });

  it('rejects the current password as the new password', () => {
    const r = changePasswordSchema.safeParse({ ...base, newPassword: OLD, confirmPassword: OLD });
    expect(r.success).toBe(false);
    expect(r.error!.flatten().fieldErrors.newPassword).toContain('SAME_AS_CURRENT');
  });
});

describe('POST /api/account/password', () => {
  it('requires authentication', async () => {
    (getServerSession as any).mockResolvedValue(null);
    const res = await post({ currentPassword: OLD, newPassword: NEW, confirmPassword: NEW });
    expect(res.status).toBe(401);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects an incorrect current password and keeps the old hash', async () => {
    const before = row.passwordHash;
    const res = await post({ currentPassword: 'wrong-password', newPassword: NEW, confirmPassword: NEW });
    expect(res.status).toBe(400);
    expect((await res.json()).error.details.reason).toBe('INVALID_CURRENT_PASSWORD');
    expect(row.passwordHash).toBe(before);
  });

  it('rejects mismatched new passwords without touching the database', async () => {
    const res = await post({ currentPassword: OLD, newPassword: NEW, confirmPassword: 'other-password-789' });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details.fieldErrors.confirmPassword).toContain('PASSWORD_MISMATCH');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a too-weak (too short) new password', async () => {
    const res = await post({ currentPassword: OLD, newPassword: 'short', confirmPassword: 'short' });
    expect(res.status).toBe(400);
    expect((await res.json()).error.details.fieldErrors.newPassword).toBeDefined();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects the current password as the new password', async () => {
    const res = await post({ currentPassword: OLD, newPassword: OLD, confirmPassword: OLD });
    expect(res.status).toBe(400);
    expect((await res.json()).error.details.fieldErrors.newPassword).toContain('SAME_AS_CURRENT');
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('changes the password: new bcrypt hash stored, never the plaintext', async () => {
    const res = await post({ currentPassword: OLD, newPassword: NEW, confirmPassword: NEW });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ changed: true });

    expect(row.passwordHash).not.toContain(NEW);
    expect(row.passwordHash).toMatch(/^\$2[aby]\$12\$/); // same bcrypt cost as registration
    expect(await bcrypt.compare(NEW, row.passwordHash!)).toBe(true);
    expect(await bcrypt.compare(OLD, row.passwordHash!)).toBe(false);
  });

  it('is rate limited per user', async () => {
    for (let i = 0; i < 5; i += 1) {
      await post({ currentPassword: 'wrong-password', newPassword: NEW, confirmPassword: NEW });
    }
    const res = await post({ currentPassword: OLD, newPassword: NEW, confirmPassword: NEW });
    expect(res.status).toBe(429);
    expect(await bcrypt.compare(OLD, row.passwordHash!)).toBe(true);
  });
});

describe('changePassword() service guards', () => {
  it('refuses an account without a password hash', async () => {
    row.passwordHash = null;
    await expect(changePassword(row.id, OLD, NEW)).rejects.toMatchObject({
      status: 400,
      details: { reason: 'NO_PASSWORD' },
    });
  });

  it('refuses new === current even when called directly', async () => {
    await expect(changePassword(row.id, OLD, OLD)).rejects.toMatchObject({
      details: { reason: 'SAME_AS_CURRENT' },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe('login after a password change', () => {
  it('works with the new password and no longer works with the old one', async () => {
    expect(await login(OLD)).toMatchObject({ id: row.id });

    const res = await post({ currentPassword: OLD, newPassword: NEW, confirmPassword: NEW });
    expect(res.status).toBe(200);

    expect(await login(OLD)).toBeNull();
    expect(await login(NEW)).toMatchObject({ id: row.id, email: row.email });
  });
});

describe('session invalidation (jwt callback)', () => {
  async function signedInToken(password: string) {
    const user = await login(password);
    return jwt({ token: { name: user.name, email: user.email }, user });
  }

  it('a session issued before the change is revoked after it', async () => {
    const oldSession = await signedInToken(OLD);
    await expect(jwt({ token: { ...oldSession } })).resolves.toMatchObject({ id: row.id });

    await post({ currentPassword: OLD, newPassword: NEW, confirmPassword: NEW });

    await expect(jwt({ token: { ...oldSession } })).rejects.toThrow('SESSION_REVOKED');
  });

  it('a session signed in with the new password stays valid', async () => {
    await post({ currentPassword: OLD, newPassword: NEW, confirmPassword: NEW });
    const newSession = await signedInToken(NEW);
    await expect(jwt({ token: { ...newSession } })).resolves.toMatchObject({ id: row.id });
  });

  it('a legacy session without a fingerprint is revoked — before and after a password change', async () => {
    const legacy = { id: row.id, role: 'USER', status: 'ACTIVE', emailVerified: null };
    await expect(jwt({ token: { ...legacy } })).rejects.toThrow('SESSION_REVOKED');

    // The gap this closes: a legacy session whose first request comes only
    // after a password change must not adopt the new fingerprint.
    await post({ currentPassword: OLD, newPassword: NEW, confirmPassword: NEW });
    await expect(jwt({ token: { ...legacy } })).rejects.toThrow('SESSION_REVOKED');
  });

  it('a session carries the fingerprint of the hash it was signed in under', async () => {
    const token = await signedInToken(OLD);
    expect(token.passwordFingerprint).toBe(passwordFingerprint(row.passwordHash));
  });

  it('the fingerprint never reaches the client-visible session', async () => {
    const token = await signedInToken(OLD);
    const session = await (authOptions.callbacks!.session as any)({ session: { user: {} }, token });
    expect(JSON.stringify(session)).not.toContain(token.passwordFingerprint);
  });
});
