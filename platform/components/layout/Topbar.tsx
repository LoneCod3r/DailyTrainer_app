'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { isAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui';
import { ThemeToggle } from './ThemeToggle';
import { MenuIcon, SearchIcon, ShieldIcon, LogOutIcon, AccountIcon } from './icons';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-sand-200 bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100 md:hidden"
      >
        <MenuIcon />
      </button>

      <div className="relative hidden flex-1 max-w-sm sm:block">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
        <input
          type="search"
          placeholder="Search practices, articles…"
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-sand-200 bg-page py-2 pl-9 pr-3 text-sm text-ink-500 placeholder:text-ink-300"
        />
      </div>

      <div className="flex flex-1 justify-end gap-2 sm:flex-none">
        <ThemeToggle />

        {status === 'loading' ? null : session?.user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-9 items-center gap-2 rounded-lg px-2 text-sm font-medium text-ink-900 hover:bg-sand-100"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <AccountIcon width={16} height={16} />
              </span>
              <span className="hidden max-w-[8rem] truncate sm:inline">{session.user.name ?? 'Account'}</span>
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
                    <AccountIcon width={16} height={16} /> Account
                  </Link>
                  {isAdmin(session.user.role) && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-sand-100"
                    >
                      <ShieldIcon width={16} height={16} /> Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-sand-100"
                  >
                    <LogOutIcon width={16} height={16} /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">
                Join
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
