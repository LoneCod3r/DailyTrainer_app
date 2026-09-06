import type { Locale } from '@/lib/i18n/locale';

export function formatDate(date: Date | string, locale: Locale, opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(locale === 'bg' ? 'bg-BG' : 'en-US', opts).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'bg' ? 'bg-BG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date),
  );
}
