'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { isAdmin } from '@/lib/permissions';
import { useT } from '@/lib/i18n/LocaleProvider';
import { PRIMARY_NAV } from './nav';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { CloseIcon, ShieldIcon, LogOutIcon } from './icons';

// Secondary navigation surface for mobile — the bottom nav only carries the
// four primary destinations, so Practices/Community sub-items, the language
// switcher and the Account sub-pages live here instead of being crammed
// into the bottom bar.
export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: session } = useSession();
  const t = useT();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 lg:hidden">
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} aria-hidden="true" />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-surface p-4 shadow-soft">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('nav.menu')}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('topbar.closeMenu')}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {PRIMARY_NAV.filter((item) => item.children).map((item) => (
          <div key={item.href} className="mb-4">
            <Link href={item.href} onClick={onClose} className="text-sm font-semibold text-ink-900">
              {t(item.labelKey)}
            </Link>
            <div className="mt-1.5 flex flex-col gap-0.5">
              {item.children!.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onClose}
                  className="rounded-lg px-2 py-1.5 text-sm text-ink-500 hover:bg-sand-100 hover:text-ink-900"
                >
                  {t(child.labelKey)}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Account sub-pages live in the Topbar's profile dropdown on
            desktop; on mobile they're reachable via the Account tab's hub
            page (app/(app)/account/page.tsx), which links to all of them —
            visible only when signed in, same as here. */}
        {session?.user && (
          <div className="mt-auto border-t border-sand-200 pt-4">
            <div className="flex flex-col gap-0.5">
              {isAdmin(session.user.role) && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-ink-700 hover:bg-sand-100"
                >
                  <ShieldIcon width={16} height={16} /> {t('topbar.admin')}
                </Link>
              )}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-ink-700 hover:bg-sand-100"
              >
                <LogOutIcon width={16} height={16} /> {t('topbar.signOut')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
