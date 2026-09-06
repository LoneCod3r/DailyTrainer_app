'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { clsx } from '@/lib/clsx';
import { isAdmin } from '@/lib/permissions';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useClickOutside } from '@/lib/useClickOutside';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ACCOUNT_NAV, PRIMARY_NAV, isActive } from './nav';
import {
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  LogOutIcon,
  AccountIcon,
  SettingsIcon,
  MembershipIcon,
  BillingIcon,
  DonationIcon,
  ChevronIcon,
} from './icons';

// One icon per Account sub-page, in the same order as ACCOUNT_NAV (Overview,
// Profile & Settings, Membership, Billing, Donation) — same icons already
// used on the account hub page (app/(app)/account/page.tsx).
const ACCOUNT_ICONS = [AccountIcon, SettingsIcon, MembershipIcon, BillingIcon, DonationIcon];

export function Topbar({ appName, onOpenMenu }: { appName: string; onOpenMenu: () => void }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const t = useT();
  const router = useRouter();

  const accountMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(accountMenuRef, () => setMenuOpen(false), menuOpen);

  // Practices/Community default to expanded while you're inside them
  // (`active`) and collapsed otherwise. Once you click the arrow, that
  // explicit choice wins regardless of which page you're on, until you
  // click it again — same contract the old sidebar nav used.
  const [openOverrides, setOpenOverrides] = useState<Record<string, boolean>>({});
  const navRef = useRef<HTMLElement>(null);
  useClickOutside(navRef, () => setOpenOverrides({}), Object.keys(openOverrides).length > 0);

  useEffect(() => {
    if (Object.keys(openOverrides).length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenOverrides({});
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openOverrides]);

  // Site search lives in the Library's existing filter (LibraryBrowser) —
  // this just navigates there with the query so Enter from anywhere in the
  // app opens real, working results instead of a disabled input.
  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/practices/library?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-sand-200 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[100rem] items-center gap-2 px-3 sm:gap-3 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t('topbar.openMenu')}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100 lg:hidden"
        >
          <MenuIcon />
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-semibold text-ink-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            {appName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden truncate sm:inline">{appName}</span>
        </Link>

        {/* Centered between the logo and the account controls, same way
            search used to sit — nav + search now share that centered slot. */}
        <div className="flex flex-1 items-center justify-center gap-4">
        {/* Primary nav — Home / Practices / Community. Was the left sidebar;
            same Link+toggle-button contract, now a horizontal navbar with
            flyout submenus instead of an inline-expanding list. */}
        <nav aria-label="Main" ref={navRef} className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            // Unlike the old sidebar (an inline list, safe to auto-expand
            // for the active section), this is a floating flyout — it must
            // only open on an explicit click, never just because you
            // navigated to a page under it (e.g. via a Home page link),
            // or it'd pop open unprompted over the page content.
            const isOpen = openOverrides[item.href] ?? false;
            return (
              <div key={item.href} className="relative">
                <div
                  className={clsx(
                    'flex items-center rounded-lg text-base font-medium transition-colors',
                    active ? 'text-link' : 'text-ink-700 hover:bg-sand-100',
                  )}
                >
                  <Link href={item.href} className="px-2 py-2">
                    {t(item.labelKey)}
                  </Link>
                  {item.children && (
                    <button
                      type="button"
                      onClick={() => setOpenOverrides((prev) => ({ ...prev, [item.href]: !isOpen }))}
                      aria-expanded={isOpen}
                      aria-label={`${t(item.labelKey)}: ${isOpen ? t('nav.collapse') : t('nav.expand')}`}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-sand-200/60"
                    >
                      <ChevronIcon className={clsx('shrink-0 transition-transform', isOpen && '-rotate-180')} />
                    </button>
                  )}
                </div>

                {item.children && isOpen && (
                  <div className="absolute left-0 top-full z-30 mt-1 flex w-56 flex-col gap-0.5 rounded-xl border border-sand-200 bg-surface p-1.5 shadow-soft">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setOpenOverrides((prev) => ({ ...prev, [item.href]: false }))}
                        className={clsx(
                          'rounded-lg px-3 py-1.5 text-base transition-colors',
                          pathname === child.href ? 'font-medium text-link' : 'text-ink-700 hover:bg-sand-100',
                        )}
                      >
                        {t(child.labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <form onSubmit={handleSearchSubmit} className="relative hidden w-full max-w-xs lg:block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('topbar.searchPlaceholder')}
            className="w-full rounded-xl border border-sand-200 bg-page py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600"
          />
        </form>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />

          {status === 'loading' ? null : session?.user ? (
            <div className="relative" ref={accountMenuRef}>
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
                <div className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-sand-200 bg-surface p-1.5 shadow-soft">
                  <p className="truncate px-3 py-2 text-xs text-ink-500">{session.user.email}</p>
                  {ACCOUNT_NAV.map((item, i) => {
                    const Icon = ACCOUNT_ICONS[i];
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-sand-100"
                      >
                        <Icon width={16} height={16} /> {t(item.labelKey)}
                      </Link>
                    );
                  })}
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
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="hidden lg:block">
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
      </div>
    </header>
  );
}
