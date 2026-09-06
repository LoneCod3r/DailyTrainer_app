import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/modules/settings/settings.service';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';

// Deliberately lighter chrome than the main app shell (no sidebar/bottom
// nav) — login/register are entry points, not part of the practice
// experience yet.
export const dynamic = 'force-dynamic';

// Sign-in/registration pages are account-entry utility pages, not content to
// surface in search results.
export const metadata: Metadata = {
  title: 'Log in or sign up',
  robots: { index: false, follow: false },
};

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="flex h-16 shrink-0 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-ink-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            {settings.appName.charAt(0).toUpperCase()}
          </span>
          {settings.appName}
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
