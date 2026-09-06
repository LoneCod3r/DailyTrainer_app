'use client';

import { clsx } from '@/lib/clsx';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';

// Compact BG/EN pill — visually secondary, sits next to ThemeToggle in the
// desktop topbar and inside the mobile drawer. Switching preserves the
// current route, theme and auth state (see LocaleProvider).
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();

  function option(value: Locale, label: string) {
    const active = locale === value;
    return (
      <button
        key={value}
        type="button"
        onClick={() => setLocale(value)}
        aria-pressed={active}
        aria-label={`${t('language.switchTo')}: ${label}`}
        className={clsx(
          'rounded-md px-1.5 py-1 text-xs font-semibold transition-colors',
          // text-ink-500 on this pill's bg-sand-100 measured 4.36:1 (fails
          // WCAG AA's 4.5:1) — ink-700 clears it comfortably.
          active ? 'bg-surface text-ink-900 shadow-sm' : 'text-ink-700 hover:text-ink-900',
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className={clsx('inline-flex items-center gap-0.5 rounded-lg bg-sand-100 p-0.5', className)}
    >
      {option('bg', t('language.bg'))}
      {option('en', t('language.en'))}
    </div>
  );
}
