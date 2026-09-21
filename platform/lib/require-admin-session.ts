import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';

// Page-level admin guard. app/admin/layout.tsx also redirects, but layouts
// and pages render in parallel in the App Router, so each admin page must
// call this before any privileged work. Redirect targets match the layout.
export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }
  if (!isAdmin(session.user.role)) {
    redirect('/');
  }

  return session;
}
