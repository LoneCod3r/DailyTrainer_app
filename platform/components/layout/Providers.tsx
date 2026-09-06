'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
    </SessionProvider>
  );
}
