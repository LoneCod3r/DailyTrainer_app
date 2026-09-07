import { Errors } from '@/lib/api-response';

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
