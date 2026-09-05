// Central information-architecture config for the app shell. Sidebar,
// mobile bottom nav, and the mobile drawer all render from this list rather
// than each hard-coding their own route tree.
export type NavChild = { href: string; label: string };
export type NavItem = {
  href: string;
  label: string;
  icon: 'home' | 'practices' | 'community' | 'account';
  children?: NavChild[];
};

export const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home' },
  {
    href: '/practices',
    label: 'Practices',
    icon: 'practices',
    children: [
      { href: '/practices/start-here', label: 'Start Here' },
      { href: '/practices/feel-better-now', label: 'Feel Better Now' },
      { href: '/practices/programs/7-days', label: '7 Days' },
      { href: '/practices/programs/14-days', label: '14 Days' },
      { href: '/practices/programs/28-days', label: '28 Days' },
      { href: '/practices/library', label: 'Library' },
    ],
  },
  {
    href: '/community',
    label: 'Community',
    icon: 'community',
    children: [
      { href: '/community/discussions', label: 'Discussions' },
      { href: '/community/courses', label: 'Courses' },
      { href: '/community/meetings', label: 'Member Meetings' },
    ],
  },
];

export const ACCOUNT_NAV: NavChild[] = [
  { href: '/account', label: 'Overview' },
  { href: '/account/settings', label: 'Profile & Settings' },
  { href: '/account/membership', label: 'Membership' },
  { href: '/account/billing', label: 'Billing' },
  { href: '/account/donation', label: 'Donation' },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: '/', label: 'Home', icon: 'home' },
  { href: '/practices', label: 'Practices', icon: 'practices' },
  { href: '/community', label: 'Community', icon: 'community' },
  { href: '/account', label: 'Account', icon: 'account' },
];

export function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
