import type { EntitlementSource, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/permissions';

// The single server-side access boundary for Reset Programs (V1 decision
// document §3/§11). Program day pages, progress APIs and — once a media
// provider is chosen — media playback all call hasProgramAccess(); nothing
// trusts the client, a query string or a redirect URL for access.
//
// Checkout is not live (lib/features.ts `programCheckout`), so today access
// comes only from an Admin grant. When checkout lands, the paid-webhook path
// calls grantProgramAccess({ source: 'PURCHASE', purchaseId }) — the same
// function, so there is exactly one way access is created.

export interface AccessViewer {
  id: string;
  role: Role;
}

// Admins can open every program (content review / support) without a grant.
// Moderators are community staff, not content staff, and get no implicit
// access.
export async function hasProgramAccess(viewer: AccessViewer | null | undefined, programSlug: string): Promise<boolean> {
  if (!viewer) return false;
  if (isAdmin(viewer.role)) return true;
  const active = await prisma.entitlement.findFirst({
    where: { userId: viewer.id, programSlug, revokedAt: null },
    select: { id: true },
  });
  return Boolean(active);
}

export async function listAccessibleProgramSlugs(viewer: AccessViewer, allSlugs: string[]): Promise<Set<string>> {
  if (isAdmin(viewer.role)) return new Set(allSlugs);
  const rows = await prisma.entitlement.findMany({
    where: { userId: viewer.id, revokedAt: null },
    select: { programSlug: true },
  });
  return new Set(rows.map((r) => r.programSlug));
}

// Idempotent: at most one active entitlement per user + program. The
// serializable transaction keeps two concurrent grants from both inserting.
export async function grantProgramAccess(input: {
  userId: string;
  programSlug: string;
  source: EntitlementSource;
  grantedById?: string;
  purchaseId?: string;
  note?: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.entitlement.findFirst({
        where: { userId: input.userId, programSlug: input.programSlug, revokedAt: null },
      });
      if (existing) return { entitlement: existing, created: false };
      const entitlement = await tx.entitlement.create({ data: input });
      return { entitlement, created: true };
    },
    { isolationLevel: 'Serializable' },
  );
}

// Keeps the row (history); access ends immediately.
export async function revokeProgramAccess(input: { userId: string; programSlug: string; reason?: string }) {
  const result = await prisma.entitlement.updateMany({
    where: { userId: input.userId, programSlug: input.programSlug, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: input.reason },
  });
  return { revoked: result.count };
}
