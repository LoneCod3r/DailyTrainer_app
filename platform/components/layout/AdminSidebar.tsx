import {
  HomeIcon,
  UsersIcon,
  MembershipIcon,
  BillingIcon,
  ContentIcon,
  CoursesIcon,
  DiscussionsIcon,
  MeetingsIcon,
  SettingsIcon,
  ShieldIcon,
} from './icons';
import { RoleSidebar, getNavBreadcrumb, type NavGroup } from './RoleSidebar';

// Mirrors the ADMIN nav tree from the Foundation Phase spec, grouped by
// function and carrying real icons. Not-yet-built modules render inline
// (disabled, "Soon" badge) so their place in the information architecture is
// visible without needing their own routes yet. Exported so AdminHeader can
// build its breadcrumb from the same source of truth instead of a second list.
//
// "Discussions" now links to /moderation/discussions (Moderator's real
// content-moderation UI, which Admin can use too via the role hierarchy)
// instead of a "Soon" placeholder — the admin panel itself still doesn't
// have its own separate discussions-admin page.
export const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ href: '/admin', label: 'Dashboard', icon: HomeIcon, exact: true }],
  },
  {
    label: 'People',
    items: [
      { href: '/admin/users', label: 'Users', icon: UsersIcon },
      { href: '/admin/membership', label: 'Membership', icon: MembershipIcon },
    ],
  },
  {
    label: 'Community',
    items: [
      { href: '/moderation/discussions', label: 'Discussions', icon: DiscussionsIcon },
      { href: '/admin/courses', label: 'Courses', icon: CoursesIcon, soon: true },
      { href: '/admin/meetings', label: 'Meetings', icon: MeetingsIcon, soon: true },
    ],
  },
  {
    label: 'Content & billing',
    items: [
      { href: '/admin/content', label: 'Content', icon: ContentIcon, soon: true },
      { href: '/admin/payments', label: 'Payments', icon: BillingIcon, soon: true },
    ],
  },
  {
    label: 'System',
    items: [{ href: '/admin/settings', label: 'Settings', icon: SettingsIcon }],
  },
];

export function getBreadcrumb(pathname: string | null): { group: string; label: string } {
  return getNavBreadcrumb(ADMIN_NAV, pathname, { group: 'Overview', label: 'Admin' });
}

export function AdminSidebar(props: {
  appName: string;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onToggleCollapsed?: () => void;
}) {
  return (
    <RoleSidebar
      nav={ADMIN_NAV}
      homeHref="/admin"
      brandIcon={ShieldIcon}
      panelLabel="Admin panel"
      {...props}
    />
  );
}
