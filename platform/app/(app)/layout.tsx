import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AppShell } from '@/components/layout/AppShell';
import { getSettings } from '@/modules/settings/settings.service';
import { getActiveSubscriptionForUser } from '@/modules/membership/membership.service';

// Reads Settings (app name shown in the shell) on every request.
export const dynamic = 'force-dynamic';

// Active plan name is fetched once here (not in Topbar itself, which is a
// client component) and threaded down through AppShell — the subtle
// "Member" indicator in the account menu (Part 2 §"Paid user visual
// treatment") needs to appear on every page in this shell, not just /account.
export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const [settings, session] = await Promise.all([getSettings(), getServerSession(authOptions)]);
  const subscription = session?.user ? await getActiveSubscriptionForUser(session.user.id) : null;

  return (
    <AppShell appName={settings.appName} planName={subscription?.membershipPlan.name ?? null}>
      {children}
    </AppShell>
  );
}
