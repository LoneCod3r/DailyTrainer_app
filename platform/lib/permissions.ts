import type { Role } from '@prisma/client';

// Central, backend-enforced role hierarchy. Every route/module should import
// from here rather than re-implementing role checks — this is the single
// source of truth referenced by Prompt.docx §11 ("All permissions must be
// enforced on the backend").
//
// Ordering matters: index = privilege level.
const ROLE_ORDER: Role[] = ['USER', 'MODERATOR', 'ADMIN'];

export function roleLevel(role: Role): number {
  return ROLE_ORDER.indexOf(role);
}

// True when `role` has at least the privilege level of `required`.
export function hasRole(role: Role | null | undefined, required: Role): boolean {
  if (!role) return false;
  return roleLevel(role) >= roleLevel(required);
}

export function isAdmin(role: Role | null | undefined): boolean {
  return hasRole(role, 'ADMIN');
}

export function isModerator(role: Role | null | undefined): boolean {
  return hasRole(role, 'MODERATOR');
}
