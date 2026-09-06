// Server-only: reads the visitor's locale preference from the cookie set by
// LanguageSwitcher. Kept separate from locale.ts so client components can
// import the shared types/constants without pulling in next/headers.
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from './locale';

export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
