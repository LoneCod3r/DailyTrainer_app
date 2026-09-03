'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '@/lib/clsx';

// Mirrors the ADMIN nav tree from the Foundation Phase spec: available
// sections first, then future modules (rendered disabled) so their place in
// the information architecture is visible without being built yet.
const AVAILABLE = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/settings', label: 'Settings' },
];

const FUTURE = ['Content', 'Courses', 'Discussions', 'Meetings', 'Membership', 'Payments'];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 border-sand-200 md:w-56 md:border-r">
      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible">
        {AVAILABLE.map((item) => {
          const active = item.exact ? pathname === item.href : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-sand-100',
              )}
            >
              {item.label}
            </Link>
          );
        })}
        <div className="mx-2 my-2 hidden border-t border-sand-200 md:block" />
        {FUTURE.map((label) => (
          <span
            key={label}
            title="Not yet implemented — reserved for a future module"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-ink-300"
          >
            {label} <span className="text-xs">· soon</span>
          </span>
        ))}
      </nav>
    </aside>
  );
}
