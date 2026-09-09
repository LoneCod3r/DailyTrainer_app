import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasRole } from '@/lib/permissions';
import { ModeratorShell } from '@/components/moderation/ModeratorShell';
import { getSettings } from '@/modules/settings/settings.service';

// Server-side moderation route protection, mirroring app/admin/layout.tsx.
// hasRole is hierarchical (lib/permissions.ts), so Admins can reach this area
// too — Moderator content-moderation tools aren't duplicated in /admin.
export default async function ModerationLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/moderation');
  }
  if (!hasRole(session.user.role, 'MODERATOR')) {
    redirect('/');
  }

  const { appName } = await getSettings();

  return (
    <ModeratorShell
      appName={appName}
      user={{ name: session.user.name ?? null, email: session.user.email ?? null, role: session.user.role }}
    >
      {children}
    </ModeratorShell>
  );
}
