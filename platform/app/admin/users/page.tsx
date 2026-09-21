import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { listUsers } from '@/modules/users/users.service';
import { UsersTable } from '@/components/admin/UsersTable';

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  // Defense in depth: AdminLayout already redirects, but layout and page
  // render in parallel, so guard here to keep listUsers from running (and
  // session from being null below) for unauthorized requests. Redirect
  // targets match app/admin/layout.tsx.
  if (!session?.user) {
    redirect('/login?callbackUrl=/admin');
  }
  if (!isAdmin(session.user.role)) {
    redirect('/');
  }

  const { users, total } = await listUsers({ page: 1, pageSize: 50 });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Users</h1>
        <p className="text-sm text-ink-500">{total} total members.</p>
      </div>
      <UsersTable initialUsers={users} currentUserId={session.user.id} />
    </div>
  );
}
