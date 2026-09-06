'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { isAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { MenuIcon, SearchIcon, ShieldIcon, LogOutIcon, AccountIcon } from './icons';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useT();

  return (
    <header className="sticky top-0 z-20 grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-sand-200 bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t('topbar.openMenu')}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100 md:hidden"
      >
        <MenuIcon />
      </button>

      {/* Flanked by two equal (1fr) columns, so this stays centered in the
          header regardless of how wide the left/right content actually is.
          Pinned to col-start-2 explicitly: the menu button above is
          display:none on desktop (md:hidden), so it drops out of grid
          auto-placement entirely — without an explicit column, this would
          get placed in column 1 instead of 2. */}
      <div className="relative col-start-2 hidden w-72 max-w-full sm:block">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          type="search"
          placeholder={t('topbar.searchPlaceholder')}
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-sand-200 bg-page py-2 pl-9 pr-3 text-sm text-ink-500 placeholder:text-ink-300"
        />
      </div>

      <div className="col-start-3 flex items-center justify-end gap-2">
        <LanguageSwitcher />
        <ThemeToggle />

        {status === 'loading' ? null : session?.user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-900 hover:bg-sand-100"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-tint text-link">
                <AccountIcon width={16} height={16} />
              </span>
              <span className="hidden max-w-[8rem] truncate sm:inline">{session.user.name ?? t('topbar.account')}</span>
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-sand-200 bg-surface p-1.5 shadow-soft">
                  <p className="truncate px-3 py-2 text-xs text-ink-500">{session.user.email}</p>
                  <Link
                    href="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-sand-100"
                  >
                    <AccountIcon width={16} height={16} /> {t('topbar.account')}
                  </Link>
                  {isAdmin(session.user.role) && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-sand-100"
                    >
                      <ShieldIcon width={16} height={16} /> {t('topbar.admin')}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-sand-100"
                  >
                    <LogOutIcon width={16} height={16} /> {t('topbar.signOut')}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                {t('topbar.login')}
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                {t('topbar.join')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
