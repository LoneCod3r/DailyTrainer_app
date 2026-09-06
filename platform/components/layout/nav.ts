import type { DictKey } from '@/lib/i18n/dictionaries';

// Central information-architecture config for the app shell. Sidebar,
// mobile bottom nav, and the mobile drawer all render from this list rather
// than each hard-coding their own route tree. Labels are dictionary keys so
// the same config renders in whichever locale is active.
export type NavChild = { href: string; labelKey: DictKey };
export type NavItem = {
  href: string;
  labelKey: DictKey;
  icon: 'home' | 'practices' | 'community' | 'account';
  children?: NavChild[];
};

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', labelKey: 'nav.home', icon: 'home' },
  {
    href: '/practices',
    labelKey: 'nav.practices',
    icon: 'practices',
    children: [
      { href: '/practices/start-here', labelKey: 'nav.startHere' },
      { href: '/practices/feel-better-now', labelKey: 'nav.feelBetterNow' },
      { href: '/practices/programs/7-days', labelKey: 'nav.days7' },
      { href: '/practices/programs/14-days', labelKey: 'nav.days14' },
      { href: '/practices/programs/28-days', labelKey: 'nav.days28' },
      { href: '/practices/library', labelKey: 'nav.library' },
    ],
  },
  {
    href: '/community',
    labelKey: 'nav.community',
    icon: 'community',
    children: [
      { href: '/community/discussions', labelKey: 'nav.discussions' },
      { href: '/community/courses', labelKey: 'nav.courses' },
      { href: '/community/meetings', labelKey: 'nav.meetings' },
    ],
  },
];

export const ACCOUNT_NAV: NavChild[] = [
  { href: '/account', labelKey: 'nav.accountOverview' },
  { href: '/account/settings', labelKey: 'nav.accountSettings' },
  { href: '/account/membership', labelKey: 'nav.accountMembership' },
  { href: '/account/billing', labelKey: 'nav.accountBilling' },
  { href: '/account/donation', labelKey: 'nav.accountDonation' },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: '/', labelKey: 'nav.home', icon: 'home' },
  { href: '/practices', labelKey: 'nav.practices', icon: 'practices' },
  { href: '/community', labelKey: 'nav.community', icon: 'community' },
  { href: '/account', labelKey: 'nav.account', icon: 'account' },
];

export function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
