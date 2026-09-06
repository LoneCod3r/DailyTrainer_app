'use client';

import { useEffect, useRef, useState } from 'react';
import { clsx } from '@/lib/clsx';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';
import { useClickOutside } from '@/lib/useClickOutside';
import { BulgariaFlag, UKFlag } from './flags';
import { ChevronIcon } from './icons';

const OPTIONS: { value: Locale; Flag: typeof BulgariaFlag }[] = [
  { value: 'bg', Flag: BulgariaFlag },
  { value: 'en', Flag: UKFlag },
];

// Compact flag dropdown — small enough to stay visible everywhere it's
// used (desktop topbar, mobile topbar, mobile drawer, account settings),
// unlike the old two-button pill which had to hide below the `sm`
// breakpoint to fit. Switching preserves the current route, theme and auth
// state (see LocaleProvider).
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const current = OPTIONS.find((o) => o.value === locale) ?? OPTIONS[0];
  const currentLabel = t(`language.${current.value}`);

  return (
    <div className={clsx('relative', className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('language.label')}: ${currentLabel}`}
        className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-ink-700 transition-colors hover:bg-sand-100"
      >
        <span className="shrink-0 overflow-hidden rounded-[2px]">
          <current.Flag />
        </span>
        {currentLabel}
        <ChevronIcon className={clsx('h-3.5 w-3.5 shrink-0 transition-transform', open && '-rotate-180')} />
      </button>

      {open && (
          <div
            role="listbox"
            aria-label={t('language.label')}
            className="absolute right-0 z-20 mt-1 w-32 rounded-xl border border-sand-200 bg-surface p-1 shadow-soft"
          >
            {OPTIONS.map(({ value, Flag }) => {
              const active = locale === value;
              const label = t(`language.${value}`);
              return (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLocale(value);
                    setOpen(false);
                  }}
                  className={clsx(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                    active ? 'bg-brand-tint font-medium text-link' : 'text-ink-700 hover:bg-sand-100',
                  )}
                >
                  <span className="shrink-0 overflow-hidden rounded-[2px]">
                    <Flag />
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
      )}
    </div>
  );
}
