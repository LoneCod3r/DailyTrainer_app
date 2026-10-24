'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { clsx } from '@/lib/clsx';
import { isAdmin, isModerator, isModeratorOnly } from '@/lib/permissions';
import { Button, Badge } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useClickOutside } from '@/lib/useClickOutside';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { BrandMark } from './BrandMark';
import { ACCOUNT_NAV, PRIMARY_NAV, isNavItemActive } from './nav';
import { LIBRARY_PATH, librarySearchHref } from '@/modules/kuko-way/search';
import {
  MenuIcon,
  SearchIcon,
  ShieldIcon,
  LogOutIcon,
  AccountIcon,
  SettingsIcon,
  MembershipIcon,
  BillingIcon,
  ChevronIcon,
} from './icons';

// One icon per Account sub-page (Overview, Profile & Settings, Membership,
// Billing) — same icons already used on the account hub page
// (app/(app)/account/page.tsx). Keyed by href (not positional) since the
// rendered list below is filtered per-role.
const ACCOUNT_ICONS: Record<string, typeof AccountIcon> = {
  '/account': AccountIcon,
  '/account/settings': SettingsIcon,
  '/account/membership': MembershipIcon,
  '/account/billing': BillingIcon,
};

// Moderator is project/community staff, not a customer — never gets the
// normal-customer financial self-service links (see lib/permissions.ts's
// isModeratorOnly and lib/auth-guards.ts's forbidModeratorFinancialAccess,
// which enforce the same boundary server-side).
const FINANCIAL_ACCOUNT_HREFS = new Set(['/account/membership', '/account/billing']);

const ACCOUNT_MENU_ID = 'topbar-account-menu';

export function Topbar({
  appName,
  planName,
  onOpenMenu,
}: {
  appName: string;
  planName?: string | null;
  onOpenMenu: () => void;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const t = useT();
  const router = useRouter();

  const accountMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(accountMenuRef, () => setMenuOpen(false), menuOpen);

  // The account dropdown also closes after any navigation (a link inside it,
  // browser back, …) and on Escape, which hands focus back to its trigger.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setMenuOpen(false);
      accountMenuRef.current?.querySelector<HTMLElement>(`button[aria-controls="${ACCOUNT_MENU_ID}"]`)?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

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
  // An empty (or whitespace-only) submit clears an active Library search —
  // back to plain browsing without `?q=` — and is a no-op on other pages.
  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim() && pathname !== LIBRARY_PATH) return;
    router.push(librarySearchHref(query));
  };

  const menuPanelClass = 'absolute right-0 z-20 mt-2 rounded-xl border border-sand-200 bg-surface shadow-soft';

  return (
    <header className="sticky top-0 z-20 border-b border-sand-200 bg-surface/90 backdrop-blur">
      {/* lg–xl (1024–1279px) is a compact desktop range: the full nav plus
          search only fit if the logo wordmark, account name and plan badge
          collapse and the guest CTA uses its short label. The plan badge
          returns at 1440px (it is also shown inside the account menu).
          Below md (768px) the account area is a single account icon (log in
          / join, or the account menu, behind it; no name or plan badge), so
          the full logo + wordmark, language and theme fit on one row down to
          320px. Below sm the icon buttons and gaps are slightly tighter, and
          below 360px the wordmark steps down one size. */}
      <div className="mx-auto flex h-16 max-w-[100rem] items-center gap-1 px-2 sm:gap-3 sm:px-6 lg:px-6 xl:px-10">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label={t('topbar.openMenu')}
          className="inline-flex h-9 w-8 shrink-0 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100 sm:w-9 lg:hidden"
        >
          <MenuIcon />
        </button>

        <Link
          href="/"
          aria-label={appName}
          className="flex shrink-0 items-center gap-1.5 text-base font-semibold text-ink-900 min-[360px]:text-xl sm:gap-2"
        >
          <BrandMark size={36} className="h-8 w-8 rounded-lg" />
          <span className="truncate lg:hidden xl:inline">{appName}</span>
        </Link>

        {/* Centered between the logo and the account controls, same way
            search used to sit — nav + search now share that centered slot. */}
        <div className="flex flex-1 items-center justify-center gap-4">
        {/* Primary nav — Practice / Programs / Learn / Journey (logo = Home). Was the left sidebar;
            same Link+toggle-button contract, now a horizontal navbar with
            flyout submenus instead of an inline-expanding list. */}
        <nav aria-label="Main" ref={navRef} className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => {
            const active = isNavItemActive(pathname, item);
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
                      onClick={() => setOpenOverrides(isOpen ? {} : { [item.href]: true })}
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
                        onClick={() => setOpenOverrides({})}
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

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <LanguageSwitcher />
          {/* !-prefixed: must beat ThemeToggle's own built-in w-9. */}
          <ThemeToggle className="!w-8 sm:!w-9" />

          {status === 'loading' ? null : session?.user ? (
            <div className="relative" ref={accountMenuRef}>
              {isAdmin(session.user.role) ? (
                // Admins go straight to the Admin panel on click — no
                // dropdown to choose from, since there's nothing else here
                // for them to pick (Moderator/member account links don't
                // apply once you're managing the admin panel).
                <Link
                  href="/admin"
                  className="flex h-9 w-9 items-center justify-center gap-2 rounded-lg text-sm font-medium text-ink-900 hover:bg-sand-100 md:w-auto md:justify-start md:px-2"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-tint text-link">
                    <AccountIcon width={16} height={16} />
                  </span>
                  <span className="hidden max-w-[8rem] truncate md:inline lg:hidden xl:inline">{session.user.name ?? t('topbar.account')}</span>
                  <span className="sr-only md:hidden lg:inline xl:hidden">{t('topbar.account')}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-controls={ACCOUNT_MENU_ID}
                  className="flex h-9 w-9 items-center justify-center gap-2 rounded-lg text-sm font-medium text-ink-900 hover:bg-sand-100 md:w-auto md:justify-start md:px-2"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-tint text-link">
                    <AccountIcon width={16} height={16} />
                  </span>
                  <span className="hidden max-w-[8rem] truncate md:inline lg:hidden xl:inline">{session.user.name ?? t('topbar.account')}</span>
                  <span className="sr-only md:hidden lg:inline xl:hidden">{t('topbar.account')}</span>
                  {/* Subtle, tasteful plan indicator — visible app-wide (not
                      just /account), same restrained brand-tone badge used
                      elsewhere, never a different color system. */}
                  {planName && (
                    <Badge tone="brand" className="hidden md:inline-flex lg:hidden min-[1440px]:inline-flex">
                      {planName}
                    </Badge>
                  )}
                </button>
              )}

              {!isAdmin(session.user.role) && menuOpen && (
                <div id={ACCOUNT_MENU_ID} className={clsx(menuPanelClass, 'w-60 p-1.5')}>
                  <p className="truncate px-3 py-2 text-xs text-ink-500">{session.user.email}</p>
                  {planName && (
                    <p className="px-3 pb-2">
                      <Badge tone="brand">{planName}</Badge>
                    </p>
                  )}
                  {ACCOUNT_NAV.filter(
                    (item) => !isModeratorOnly(session.user.role) || !FINANCIAL_ACCOUNT_HREFS.has(item.href),
                  ).map((item) => {
                    const Icon = ACCOUNT_ICONS[item.href];
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
                  {isModerator(session.user.role) && (
                    <Link
                      href="/moderation"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-sand-100"
                    >
                      <ShieldIcon width={16} height={16} /> {t('topbar.moderation')}
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
            <>
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login">
                {/* !-prefixed so it reliably wins over the Button component's
                    own built-in size padding regardless of Tailwind's class
                    ordering. */}
                <Button variant="ghost" size="sm" className="!px-2 sm:!px-3">
                  {t('topbar.login')}
                </Button>
              </Link>
              {/* Calm invitation rather than a sales CTA (concept §2/§20). The
                  short label keeps the compact lg–xl range on one line. */}
              <Link href="/register">
                <Button variant="primary" size="sm" className="!px-2 sm:!px-3">
                  <span className="sm:hidden lg:inline xl:hidden">{t('topbar.join')}</span>
                  <span className="hidden sm:inline lg:hidden xl:inline">{t('topbar.startJourney')}</span>
                </Button>
              </Link>
            </div>
            {/* Below md: log in / join behind one account icon, so the full
                wordmark keeps its room. */}
            <div className="relative md:hidden" ref={accountMenuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={t('topbar.account')}
                aria-expanded={menuOpen}
                aria-controls={ACCOUNT_MENU_ID}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-sand-100"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-tint text-link">
                  <AccountIcon width={16} height={16} />
                </span>
              </button>
              {menuOpen && (
                <div id={ACCOUNT_MENU_ID} className={clsx(menuPanelClass, 'flex w-40 flex-col items-stretch gap-0.5 p-1')}>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-center text-sm font-medium text-ink-900 hover:bg-sand-100"
                  >
                    {t('topbar.signIn')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-1.5 text-center text-sm text-link underline-offset-4 hover:underline focus-visible:underline"
                  >
                    {t('topbar.signUp')}
                  </Link>
                </div>
              )}
            </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
