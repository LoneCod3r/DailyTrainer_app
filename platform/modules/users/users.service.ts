import { Role, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/api-response';
import { createLogger } from '@/lib/logger';

const log = createLogger('users');

export async function listUsers(params: { page?: number; pageSize?: number } = {}) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.user.count(),
  ]);

  return { users, total, page, pageSize };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });
  if (!user) throw Errors.notFound('User not found');
  return user;
}

// A user may never demote/deactivate themselves via this path — prevents an
// admin from accidentally locking themselves out. Enforced here, not just
// in the UI, since this is the backend authorization boundary.
export async function updateUserRole(actingUserId: string, targetUserId: string, role: Role) {
  if (actingUserId === targetUserId) {
    throw Errors.forbidden('You cannot change your own role');
  }

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { role },
    select: { id: true, role: true },
  });

  log.info('user role updated', { actingUserId, targetUserId, role });
  return user;
}

export async function updateUserStatus(actingUserId: string, targetUserId: string, status: UserStatus) {
  if (actingUserId === targetUserId) {
    throw Errors.forbidden('You cannot change your own account status');
  }

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { status },
    select: { id: true, status: true },
  });

  log.info('user status updated', { actingUserId, targetUserId, status });
  return user;
}

export async function getUserStats() {
  const [totalUsers, byRole, byStatus, newLast30Days] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ['role'], _count: true }),
    prisma.user.groupBy({ by: ['status'], _count: true }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    totalUsers,
    newLast30Days,
    byRole: Object.fromEntries(byRole.map((r) => [r.role, r._count])),
    byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
  };
}
