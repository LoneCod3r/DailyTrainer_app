import { describe, it, expect, vi, beforeEach } from 'vitest';

// No real database or session: prisma and next-auth are mocked, so the route
// handler and users.service run exactly as in production otherwise.
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

const { prisma } = await import('@/lib/prisma');
const { getServerSession } = await import('next-auth');
const { GET } = await import('@/app/api/users/[id]/route');

const SENSITIVE = ['passwordHash', 'failedLoginAttempts', 'lockedUntil', 'stripeCustomerId'];

// Behaves like Prisma: returns only what `select` asks for from a full row
// that (deliberately) contains every sensitive column.
const FULL_ROW: Record<string, unknown> = {
  id: 'u1',
  name: 'Member',
  email: 'member@example.dev',
  role: 'USER',
  status: 'ACTIVE',
  emailVerified: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
  passwordHash: '$2b$10$secret',
  failedLoginAttempts: 3,
  lockedUntil: new Date('2026-02-01'),
  stripeCustomerId: 'cus_123',
  profile: { avatarUrl: null, bio: 'hi', interests: [], visibility: 'MEMBERS', id: 'p1', userId: 'u1' },
};

function applySelect(row: Record<string, any>, select: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, val] of Object.entries(select)) {
    if (!val) continue;
    out[key] = val === true ? row[key] : applySelect(row[key], val.select);
  }
  return out;
}

const call = (id: string) => GET(new Request(`http://localhost/api/users/${id}`), { params: { id } });
const asSession = (user: { id: string; role: string } | null) =>
  (getServerSession as any).mockResolvedValue(user ? { user } : null);

beforeEach(() => {
  vi.clearAllMocks();
  (prisma.user.findUnique as any).mockImplementation(async ({ select }: any) => applySelect(FULL_ROW, select));
});

describe('GET /api/users/[id]', () => {
  it('lets a user read their own record with safe fields only', async () => {
    asSession({ id: 'u1', role: 'USER' });
    const res = await call('u1');
    expect(res.status).toBe(200);
    const { user } = await res.json();
    expect(user).toMatchObject({ id: 'u1', email: 'member@example.dev', role: 'USER', status: 'ACTIVE' });
    expect(user.profile).toEqual({ avatarUrl: null, bio: 'hi', interests: [], visibility: 'MEMBERS' });
    for (const key of SENSITIVE) expect(user).not.toHaveProperty(key);
  });

  it('lets an admin read any user, still without sensitive fields', async () => {
    asSession({ id: 'admin1', role: 'ADMIN' });
    const res = await call('u1');
    expect(res.status).toBe(200);
    const body = JSON.stringify(await res.json());
    for (const key of SENSITIVE) expect(body).not.toContain(key);
    expect(body).not.toContain('$2b$10$secret');
  });

  it('never asks Prisma for sensitive columns', async () => {
    asSession({ id: 'u1', role: 'USER' });
    await call('u1');
    const args = (prisma.user.findUnique as any).mock.calls[0][0];
    expect(args.include).toBeUndefined();
    for (const key of SENSITIVE) expect(args.select[key]).toBeUndefined();
  });

  it('rejects unauthenticated requests with 401 before any query', async () => {
    asSession(null);
    expect((await call('u1')).status).toBe(401);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects a non-admin reading someone else's record with 403 before any query", async () => {
    asSession({ id: 'u2', role: 'USER' });
    expect((await call('u1')).status).toBe(403);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});
