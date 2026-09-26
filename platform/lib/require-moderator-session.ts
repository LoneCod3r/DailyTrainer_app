import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/permissions';

// Page-level Moderator+ guard — the moderation counterpart of
// requireAdminSession(). app/moderation/layout.tsx also redirects, but layouts
// and pages render in parallel in the App Router, and a client-side (RSC)
// navigation re-renders only the page segment, skipping layouts the client
// already has. Each moderation page must therefore call this before any
// privileged work. Role check (hierarchical, so Admin passes) and redirect
// targets match the layout.
export async function requireModeratorSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/moderation');
  }
  if (!hasRole(session.user.role, 'MODERATOR')) {
    redirect('/');
  }

  return session;
}
