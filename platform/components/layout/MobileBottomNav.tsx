'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';
import { BOTTOM_NAV, isActive } from './nav';
import { HomeIcon, PracticesIcon, CommunityIcon, AccountIcon } from './icons';

const ICONS = {
  home: HomeIcon,
  practices: PracticesIcon,
  community: CommunityIcon,
  account: AccountIcon,
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-sand-200 bg-surface/95 backdrop-blur lg:hidden">
      {BOTTOM_NAV.map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium',
              active ? 'text-link' : 'text-ink-500',
            )}
          >
            <Icon />
            {t(item.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
