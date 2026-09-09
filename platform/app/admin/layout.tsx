import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { AdminShell } from '@/components/admin/AdminShell';
import { getSettings } from '@/modules/settings/settings.service';

// Server-side admin route protection (Prompt2 §3/§12): this check runs on
// the server for every request under /admin, so it cannot be bypassed by
// disabling JavaScript or forging client-side state.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }
  if (!isAdmin(session.user.role)) {
    redirect('/');
  }

  const { appName } = await getSettings();

  return (
    <AdminShell
      appName={appName}
      user={{ name: session.user.name ?? null, email: session.user.email ?? null, role: session.user.role }}
    >
      {children}
    </AdminShell>
  );
}
