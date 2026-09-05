import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/lib/permissions';
import { Container } from '@/components/ui';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

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

  return (
    <div className="min-h-screen bg-page">
      <header className="flex h-14 items-center justify-between border-b border-sand-200 px-4 sm:px-6">
        <Link href="/" className="text-sm font-medium text-ink-700 hover:text-ink-900">
          ← Back to app
        </Link>
        <ThemeToggle />
      </header>
      <Container className="flex flex-col gap-8 py-8 md:flex-row md:gap-10">
        <AdminSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </Container>
    </div>
  );
}
