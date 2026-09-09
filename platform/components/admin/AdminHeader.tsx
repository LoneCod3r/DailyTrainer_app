import type { Role } from '@prisma/client';
import { RoleHeader } from '@/components/layout/RoleHeader';
import { ADMIN_NAV } from '@/components/layout/AdminSidebar';

// Quick-jump over the admin routes that actually exist today — a real,
// working shortcut rather than a decorative search box with nothing behind it.
const JUMP_TARGETS = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/membership', label: 'Membership plans' },
  { href: '/moderation/discussions', label: 'Discussions' },
  { href: '/admin/settings', label: 'Settings' },
];

export function AdminHeader({
  user,
  onOpenMobileNav,
}: {
  user: { name: string | null; email: string | null; role: Role };
  onOpenMobileNav: () => void;
}) {
  return (
    <RoleHeader
      nav={ADMIN_NAV}
      breadcrumbFallback={{ group: 'Overview', label: 'Admin' }}
      jumpTargets={JUMP_TARGETS}
      emptyNotificationsCopy="You're all caught up — nothing new to review."
      user={user}
      onOpenMobileNav={onOpenMobileNav}
    />
  );
}
