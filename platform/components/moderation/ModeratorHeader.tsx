import type { Role } from '@prisma/client';
import { RoleHeader } from '@/components/layout/RoleHeader';
import { MODERATOR_NAV } from '@/components/layout/ModeratorSidebar';

const JUMP_TARGETS = [
  { href: '/moderation', label: 'Dashboard' },
  { href: '/moderation/reports', label: 'Reports' },
  { href: '/moderation/discussions', label: 'Discussions' },
  { href: '/moderation/users', label: 'Members' },
  { href: '/moderation/history', label: 'History' },
];

export function ModeratorHeader({
  user,
  onOpenMobileNav,
}: {
  user: { name: string | null; email: string | null; role: Role };
  onOpenMobileNav: () => void;
}) {
  return (
    <RoleHeader
      nav={MODERATOR_NAV}
      breadcrumbFallback={{ group: 'Overview', label: 'Moderation' }}
      jumpTargets={JUMP_TARGETS}
      emptyNotificationsCopy="Nothing needs your attention right now."
      user={user}
      onOpenMobileNav={onOpenMobileNav}
    />
  );
}
