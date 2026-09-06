'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';
import { PRIMARY_NAV, ACCOUNT_NAV, isActive } from './nav';
import { HomeIcon, PracticesIcon, CommunityIcon, AccountIcon, ChevronIcon } from './icons';

const ICONS = {
  home: HomeIcon,
  practices: PracticesIcon,
  community: CommunityIcon,
  account: AccountIcon,
};

export function Sidebar({ appName }: { appName: string }) {
  const pathname = usePathname();
  const t = useT();
  // Sections with children default to expanded while you're inside them
  // (`active`) and collapsed otherwise. Once you click the arrow, that
  // explicit choice wins regardless of which page you're on, until you
  // click it again.
  const [openOverrides, setOpenOverrides] = useState<Record<string, boolean>>({});

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sand-200 bg-surface md:flex">
      <Link href="/" className="flex h-16 shrink-0 items-center gap-2 border-b border-sand-200 px-5 text-lg font-semibold text-ink-900">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          {appName.charAt(0).toUpperCase()}
        </span>
        <span className="truncate">{appName}</span>
      </Link>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {PRIMARY_NAV.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href);
          const isOpen = openOverrides[item.href] ?? active;
          return (
            <div key={item.href}>
              <div
                className={clsx(
                  'flex items-center gap-1 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-brand-tint text-link' : 'text-ink-700 hover:bg-sand-100',
                )}
              >
                <Link href={item.href} className="flex flex-1 items-center gap-2.5 px-3 py-2">
                  <Icon className="shrink-0" />
                  <span className="flex-1">{t(item.labelKey)}</span>
                </Link>
                {item.children && (
                  <button
                    type="button"
                    onClick={() => setOpenOverrides((prev) => ({ ...prev, [item.href]: !isOpen }))}
                    aria-expanded={isOpen}
                    aria-label={`${t(item.labelKey)}: ${isOpen ? t('nav.collapse') : t('nav.expand')}`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-sand-200/60"
                  >
                    <ChevronIcon className={clsx('shrink-0 transition-transform', isOpen ? '-rotate-180' : '')} />
                  </button>
                )}
              </div>
              {item.children && isOpen && (
                <div className="ml-[1.85rem] mt-1 flex flex-col gap-0.5 border-l border-sand-200 pl-3">
                  {item.children.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={clsx(
                          'rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                          childActive ? 'font-medium text-link' : 'text-ink-500 hover:text-ink-900',
                        )}
                      >
                        {t(child.labelKey)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Account is a secondary/supporting area — kept visually quieter than
          the Practices/Community experience above. */}
      <div className="border-t border-sand-200 px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">{t('nav.account')}</p>
        <div className="flex flex-col gap-0.5">
          {ACCOUNT_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'rounded-lg px-3 py-1.5 text-sm transition-colors',
                  active ? 'font-medium text-link' : 'text-ink-500 hover:bg-sand-100 hover:text-ink-900',
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
