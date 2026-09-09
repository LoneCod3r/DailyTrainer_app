import type { Role } from '@prisma/client';
import { Errors } from '@/lib/api-response';
import { hasRole, isModeratorOnly } from '@/lib/permissions';

// Central, backend-enforced email-verification gate — mirrors the shape of
// lib/permissions.ts's role gate. A signed-in-but-unverified user still has
// a session (so the UI can show a "verify your email" prompt), but every
// route that performs a member action must call this first so the
// restriction can never be bypassed by calling the API directly, whatever
// the client does or doesn't show.
export function requireVerifiedUser(user: { emailVerified?: Date | null } | null | undefined) {
  if (!user?.emailVerified) {
    throw Errors.emailNotVerified();
  }
}

// Throwing counterpart to lib/permissions.ts's hasRole — every API route
// that is Moderator+/Admin-only should call this instead of hand-rolling
// `if (!isX(role)) throw Errors.forbidden()`, so the check (and its error
// shape) stays identical everywhere it's used.
export function requireRole(role: Role | null | undefined, required: Role) {
  if (!hasRole(role, required)) {
    throw Errors.forbidden();
  }
}

// Blocks the normal-customer financial self-service surface (subscribe,
// billing portal, donation checkout) for Moderator specifically — see
// isModeratorOnly in lib/permissions.ts for why this is an exact-role check
// rather than hasRole. Admin is never affected by this guard.
export function forbidModeratorFinancialAccess(role: Role | null | undefined) {
  if (isModeratorOnly(role)) {
    throw Errors.forbidden();
  }
}
