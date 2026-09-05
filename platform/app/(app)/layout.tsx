import { AppShell } from '@/components/layout/AppShell';
import { getSettings } from '@/modules/settings/settings.service';

// Reads Settings (app name shown in the shell) on every request.
export const dynamic = 'force-dynamic';

export default async function AppGroupLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return <AppShell appName={settings.appName}>{children}</AppShell>;
}
