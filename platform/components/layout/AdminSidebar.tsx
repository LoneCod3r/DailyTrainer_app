'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '@/lib/clsx';
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
  CloseIcon,
  PanelIcon,
  ShieldIcon,
} from './icons';
import type { ComponentType, SVGProps } from 'react';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type NavLeaf = { href: string; label: string; icon: Icon; exact?: boolean; soon?: boolean };
type NavGroup = { label: string; items: NavLeaf[] };

// Mirrors the ADMIN nav tree from the Foundation Phase spec, grouped by
// function and carrying real icons. Not-yet-built modules render inline
// (disabled, "Soon" badge) so their place in the information architecture is
// visible without needing their own routes yet. Exported so AdminHeader can
// build its breadcrumb from the same source of truth instead of a second list.
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
      { href: '/admin/discussions', label: 'Discussions', icon: DiscussionsIcon, soon: true },
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
  if (pathname) {
    for (const group of ADMIN_NAV) {
      const match = group.items.find((item) => (item.exact ? pathname === item.href : pathname.startsWith(item.href)));
      if (match) return { group: group.label, label: match.label };
    }
  }
  return { group: 'Overview', label: 'Admin' };
}

export function AdminSidebar({
  appName,
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
  onToggleCollapsed,
}: {
  appName: string;
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onToggleCollapsed?: () => void;
}) {
  const pathname = usePathname();

  const brand = (
    <Link
      href="/admin"
      onClick={onCloseMobile}
      className={clsx('flex items-center gap-2.5 px-3 pb-4', collapsed && 'justify-center px-0')}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
        <ShieldIcon width={18} height={18} />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-ink-900">{appName}</span>
          <span className="block truncate text-xs text-ink-500">Admin panel</span>
        </span>
      )}
    </Link>
  );

  const nav = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
      {ADMIN_NAV.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-300">{group.label}</p>
          )}
          {group.items.map((item) => {
            const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
            const Icon = item.icon;

            if (item.soon) {
              return (
                <span
                  key={item.href}
                  title="Not yet implemented — reserved for a future module"
                  className={clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-300',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      <span className="rounded-full bg-sand-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-300">
                        Soon
                      </span>
                    </>
                  )}
                </span>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={clsx(
                  'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  active
                    ? 'border-brand-tint bg-brand-tint text-link'
                    : 'border-transparent text-ink-700 hover:bg-sand-100',
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop / tablet — sticky column, collapsible to icon-only. */}
      <aside
        className={clsx(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sand-200 bg-surface py-4 md:flex',
          collapsed ? 'w-[4.5rem] px-2' : 'w-64 px-3',
        )}
      >
        {brand}
        {nav}
        {onToggleCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={clsx(
              'mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-500 hover:bg-sand-100 hover:text-ink-900',
              collapsed && 'justify-center px-0',
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <PanelIcon className={clsx('h-[18px] w-[18px] shrink-0 transition-transform', collapsed && 'rotate-180')} />
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </aside>

      {/* Mobile — full drawer overlay. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={onCloseMobile} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-5 overflow-y-auto bg-surface p-4 pt-5 shadow-soft">
            <div className="flex items-center justify-between">
              {brand}
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="mb-4 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100"
              >
                <CloseIcon />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}
    </>
  );
}
