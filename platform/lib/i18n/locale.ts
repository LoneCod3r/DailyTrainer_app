// Locale primitives with no server-only dependencies — safe to import from
// both client and server components. Server components additionally use
// `getLocale()` from `./get-locale` (which reads the cookie via
// next/headers) to resolve the active locale.
export type Locale = 'bg' | 'en';

export const LOCALES: Locale[] = ['bg', 'en'];
export const DEFAULT_LOCALE: Locale = 'bg';
export const LOCALE_COOKIE = 'ptd_locale';

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'bg' || value === 'en';
}
