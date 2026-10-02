'use client';

import { SessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';
import { LocaleProvider } from '@/lib/i18n/LocaleProvider';
import type { Locale } from '@/lib/i18n/locale';
import { LegalProvider } from '@/components/legal/LegalProvider';
import type { PublicLegalConfig } from '@/modules/legal/legal.service';
import type { CookieConsent } from '@/modules/legal/cookie-consent';

export function Providers({
  locale,
  legalConfig,
  consent,
  children,
}: {
  locale: Locale;
  legalConfig: PublicLegalConfig;
  consent: CookieConsent | null;
  children: ReactNode;
}) {
  return (
    <SessionProvider>
      <LocaleProvider initialLocale={locale}>
        <LegalProvider config={legalConfig} initialConsent={consent}>
          {children}
        </LegalProvider>
      </LocaleProvider>
    </SessionProvider>
  );
}
