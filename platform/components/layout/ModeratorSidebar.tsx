import { HomeIcon, DiscussionsIcon, FlagIcon, UsersIcon, HistoryIcon, ShieldIcon } from './icons';
import { RoleSidebar, getNavBreadcrumb, type NavGroup } from './RoleSidebar';

// Moderator's dedicated work area — a moderation queue, not an Admin-panel
// copy. Only covers what the backend actually supports today: Reports
// (modules/moderation) and Discussion/Reply moderation (ModerationStatus).
// "Users" here is intentionally narrow — suspend/reactivate ordinary
// members only (see setUserStatusAsModerator) — not the Admin People/Users
// page, which also changes roles.
export const MODERATOR_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/moderation', label: 'Dashboard', icon: HomeIcon, exact: true }],
  },
  {
    label: 'Queue',
    items: [
      { href: '/moderation/reports', label: 'Reports', icon: FlagIcon },
      { href: '/moderation/discussions', label: 'Discussions', icon: DiscussionsIcon },
    ],
  },
  {
    label: 'Community',
    items: [{ href: '/moderation/users', label: 'Members', icon: UsersIcon }],
  },
  {
    label: 'Records',
    items: [{ href: '/moderation/history', label: 'History', icon: HistoryIcon }],
  },
];

export function getModeratorBreadcrumb(pathname: string | null): { group: string; label: string } {
  return getNavBreadcrumb(MODERATOR_NAV, pathname, { group: 'Overview', label: 'Moderation' });
}

export function ModeratorSidebar(props: {
  appName: string;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onToggleCollapsed?: () => void;
}) {
  return (
    <RoleSidebar
      nav={MODERATOR_NAV}
      homeHref="/moderation"
      brandIcon={ShieldIcon}
      panelLabel="Moderation"
      {...props}
    />
  );
}
