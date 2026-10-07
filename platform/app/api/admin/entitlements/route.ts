import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandling, jsonOk, Errors } from '@/lib/api-response';
import { requireRole } from '@/lib/auth-guards';
import { getAllProgramsUnfiltered } from '@/modules/programs/service';
import { grantProgramAccess, revokeProgramAccess } from '@/modules/commerce/entitlements.service';

// Admin-only manual program access — support cases, staff and pre-launch
// review, while checkout is disabled (lib/features.ts). Purchases will grant
// through the same entitlements.service function once checkout is live.
const bodySchema = z.object({
  email: z.string().email(),
  programSlug: z.string().min(1),
  note: z.string().max(500).optional(),
});

async function resolve(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw Errors.unauthorized();
  requireRole(session.user.role, 'ADMIN');

  const input = bodySchema.parse(await req.json());
  if (!getAllProgramsUnfiltered().some((p) => p.slug === input.programSlug)) throw Errors.notFound('Program not found');
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() }, select: { id: true } });
  if (!user) throw Errors.notFound('User not found');
  return { adminId: session.user.id, userId: user.id, ...input };
}

export async function POST(req: Request) {
  return withErrorHandling(async () => {
    const { adminId, userId, programSlug, note } = await resolve(req);
    const { created } = await grantProgramAccess({ userId, programSlug, source: 'ADMIN_GRANT', grantedById: adminId, note });
    return jsonOk({ granted: true, created }, created ? 201 : 200);
  });
}

export async function DELETE(req: Request) {
  return withErrorHandling(async () => {
    const { userId, programSlug, note } = await resolve(req);
    const { revoked } = await revokeProgramAccess({ userId, programSlug, reason: note });
    return jsonOk({ revoked });
  });
}
