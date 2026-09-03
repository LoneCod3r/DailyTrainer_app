import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));

const { prisma } = await import('@/lib/prisma');
const { registerUser } = await import('@/modules/auth/auth.service');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('registerUser', () => {
  it('rejects registration when the email is already taken', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });

    await expect(registerUser({ name: 'A', email: 'a@b.com', password: 'longenoughpw' })).rejects.toMatchObject({
      status: 409,
    });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('stores a bcrypt hash, never the plaintext password', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockImplementation(async ({ data }: any) => ({
      id: 'new-user',
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      __passwordHash: data.passwordHash,
    }));

    await registerUser({ name: 'A', email: 'A@Example.com', password: 'longenoughpw' });

    const call = (prisma.user.create as any).mock.calls[0][0];
    expect(call.data.email).toBe('a@example.com'); // normalized to lowercase
    expect(call.data.passwordHash).not.toBe('longenoughpw');
    expect(await bcrypt.compare('longenoughpw', call.data.passwordHash)).toBe(true);
  });
});
