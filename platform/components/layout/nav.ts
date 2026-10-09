import type { DictKey } from '@/lib/i18n/dictionaries';
import { features } from '@/lib/features';

// Central information-architecture config for the app shell. The topbar,
// mobile bottom nav, and the mobile drawer all render from these lists
// rather than each hard-coding their own route tree. Labels are dictionary
// keys so the same config renders in whichever locale is active.
//
// V1 IA (KUKO WAY concept §2 + V1 decision document §9): Practice ·
// Programs · Learn · Journey, with the logo as Home. Community is a V2 area
// in the concept, so it moves out of the primary nav into the drawer and
// footer — its routes are unchanged. URLs are unchanged too: Programs lives
// at /practices/programs (so `matchExclude` keeps Practice from also
// lighting up there).
export type NavChild = { href: string; labelKey: DictKey };
export type NavItem = {
  href: string;
  labelKey: DictKey;
  icon: 'home' | 'practices' | 'programs' | 'journey' | 'community' | 'account';
  children?: NavChild[];
  matchExclude?: string[];
};

const PRACTICE_NAV: NavItem = {
  href: '/practices',
  labelKey: 'nav.practices',
  icon: 'practices',
  matchExclude: ['/practices/programs'],
  children: [
    { href: '/practices/start-here', labelKey: 'nav.startHere' },
    { href: '/practices/feel-better-now', labelKey: 'nav.feelBetterNow' },
    { href: '/practices/library', labelKey: 'nav.library' },
    { href: '/practices/free-videos', labelKey: 'nav.freeVideos' },
  ],
};

const PROGRAMS_NAV: NavItem = { href: '/practices/programs', labelKey: 'nav.programs', icon: 'programs' };
const JOURNEY_NAV: NavItem = { href: '/journey', labelKey: 'nav.journey', icon: 'journey' };

export const PRIMARY_NAV: NavItem[] = [
  PRACTICE_NAV,
  PROGRAMS_NAV,
  { href: '/learn', labelKey: 'nav.learn', icon: 'practices' },
  JOURNEY_NAV,
];

// Secondary destinations — reachable from the mobile drawer and the footer,
// not the primary bar (concept: Community is V2).
export const COMMUNITY_NAV: NavItem = {
  href: '/community',
  labelKey: 'nav.community',
  icon: 'community',
  children: [
    { href: '/community/discussions', labelKey: 'nav.discussions' },
    { href: '/community/courses', labelKey: 'nav.courses' },
    { href: '/community/meetings', labelKey: 'nav.meetings' },
  ],
};

export const ACCOUNT_NAV: NavChild[] = [
  { href: '/account', labelKey: 'nav.accountOverview' },
  { href: '/account/settings', labelKey: 'nav.accountSettings' },
  // Membership sales are off in V1 (lib/features.ts) — the page still exists
  // for direct access, it just isn't advertised in the account menu.
  ...(features.membershipSales ? [{ href: '/account/membership', labelKey: 'nav.accountMembership' as DictKey }] : []),
  { href: '/account/billing', labelKey: 'nav.accountBilling' },
];

// Voluntary support ("Support Us") lives in the site footer, not the main
// navigation. Shown to guests (the page sends them through login) and
// signed-in users, never to Moderator-only staff — the Donation page itself
// enforces the same rules.
export const SUPPORT_NAV: NavChild = { href: '/account/donation', labelKey: 'nav.supportUs' };

// One-handed reach to the practice (concept §2): Home | Practice | Programs |
// Journey | Profile. Programs takes the concept's Community slot (V2).
export const BOTTOM_NAV: NavItem[] = [
  { href: '/', labelKey: 'nav.home', icon: 'home' },
  { ...PRACTICE_NAV, children: undefined },
  PROGRAMS_NAV,
  JOURNEY_NAV,
  { href: '/account', labelKey: 'nav.profile', icon: 'account' },
];

export function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavItemActive(pathname: string | null, item: Pick<NavItem, 'href' | 'matchExclude'>): boolean {
  if (!isActive(pathname, item.href)) return false;
  return !(item.matchExclude ?? []).some((prefix) => isActive(pathname, prefix));
}
