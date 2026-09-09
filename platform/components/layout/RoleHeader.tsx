'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { Role } from '@prisma/client';
import { useClickOutside } from '@/lib/useClickOutside';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { MenuIcon, SearchIcon, BellIcon, LogOutIcon, ChevronIcon } from '@/components/layout/icons';
import { getNavBreadcrumb, type NavGroup } from './RoleSidebar';

// Generic building block behind both AdminHeader and ModeratorHeader — see
// RoleSidebar.tsx for the same pattern applied to the sidebar half of the
// shell.
const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Admin',
  MODERATOR: 'Moderator',
  USER: 'Member',
};

function initials(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || '?';
  return source.charAt(0).toUpperCase();
}

export function RoleHeader({
  nav,
  breadcrumbFallback,
  jumpTargets,
  emptyNotificationsCopy,
  user,
  onOpenMobileNav,
}: {
  nav: NavGroup[];
  breadcrumbFallback: { group: string; label: string };
  jumpTargets: { href: string; label: string }[];
  emptyNotificationsCopy: string;
  user: { name: string | null; email: string | null; role: Role };
  onOpenMobileNav: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { group, label } = getNavBreadcrumb(nav, pathname, breadcrumbFallback);

  const [query, setQuery] = useState('');
  const [jumpOpen, setJumpOpen] = useState(false);
  const jumpRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  useClickOutside(jumpRef, () => setJumpOpen(false), jumpOpen);

  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  useClickOutside(notifRef, () => setNotifOpen(false), notifOpen);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen);

  // Cmd/Ctrl+K jumps straight to the search box, matching the shortcut a
  // "Jump to…" affordance implies rather than just showing it decoratively.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const matches = useMemo(
    () => (query.trim() ? jumpTargets.filter((t) => t.label.toLowerCase().includes(query.trim().toLowerCase())) : []),
    [query, jumpTargets],
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (matches[0]) {
      router.push(matches[0].href);
      setQuery('');
      setJumpOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-sand-200 bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100 md:hidden"
      >
        <MenuIcon />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
        <span className="hidden shrink-0 text-ink-500 sm:inline">{group}</span>
        <ChevronIcon className="hidden shrink-0 text-ink-300 sm:block" width={14} height={14} />
        <span className="truncate font-semibold text-ink-900">{label}</span>
      </div>

      <div className="relative hidden sm:block" ref={jumpRef}>
        <form onSubmit={handleSubmit} className="relative w-56 lg:w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setJumpOpen(true);
            }}
            onFocus={() => setJumpOpen(true)}
            placeholder="Jump to…"
            className="w-full rounded-xl border border-sand-200 bg-page py-2 pl-9 pr-12 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-sand-200 bg-sand-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-300">
            ⌘K
          </kbd>
        </form>
        {jumpOpen && matches.length > 0 && (
          <div className="absolute right-0 top-full z-30 mt-1 w-full min-w-[14rem] rounded-xl border border-sand-200 bg-surface p-1.5 shadow-soft">
            {matches.map((m) => (
              <Link
                key={m.href}
                href={m.href}
                onClick={() => {
                  setQuery('');
                  setJumpOpen(false);
                }}
                className="block rounded-lg px-3 py-1.5 text-sm text-ink-700 hover:bg-sand-100"
              >
                {m.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="relative shrink-0" ref={notifRef}>
        <button
          type="button"
          onClick={() => setNotifOpen((v) => !v)}
          aria-label="Notifications"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100"
        >
          <BellIcon />
        </button>
        {notifOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-sand-200 bg-surface p-3 shadow-soft">
            <p className="text-sm font-medium text-ink-900">Notifications</p>
            <p className="mt-2 text-sm text-ink-500">{emptyNotificationsCopy}</p>
          </div>
        )}
      </div>

      <ThemeToggle />

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 items-center gap-2 rounded-lg pl-1 pr-2 text-sm font-medium text-ink-900 hover:bg-sand-100"
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
            {initials(user.name, user.email)}
          </span>
          <span className="hidden flex-col items-start leading-tight lg:flex">
            <span className="max-w-[8rem] truncate">{user.name ?? user.email ?? 'Account'}</span>
            <span className="text-xs font-normal text-ink-500">{ROLE_LABEL[user.role]}</span>
          </span>
          <ChevronIcon className="hidden shrink-0 text-ink-300 lg:block" width={14} height={14} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-sand-200 bg-surface p-1.5 shadow-soft">
            <p className="truncate px-3 py-2 text-xs text-ink-500">{user.email}</p>
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-sand-100"
            >
              ← Back to app
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-sand-100"
            >
              <LogOutIcon width={16} height={16} /> Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
