'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';
import { BOTTOM_NAV, isNavItemActive } from './nav';
import { HomeIcon, PracticesIcon, ProgramsIcon, JourneyIcon, CommunityIcon, AccountIcon } from './icons';

const ICONS = {
  home: HomeIcon,
  practices: PracticesIcon,
  programs: ProgramsIcon,
  journey: JourneyIcon,
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
        const active = isNavItemActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2.5 text-[0.7rem] font-medium',
              active ? 'text-link' : 'text-ink-500',
            )}
          >
            <Icon />
            <span className="max-w-full truncate">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
