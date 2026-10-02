'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useLegal } from './LegalProvider';

// First-visit consent prompt. It doesn't block the page and closes on any
// of the three choices. "Accept all" and "Reject optional" have identical
// styling and weight, so rejecting is never harder than accepting. Nothing
// optional is assumed while the banner is open: no choice means only the
// necessary category.
export function CookieBanner() {
  const t = useT();
  const { acceptAll, rejectOptional, openSettings, config } = useLegal();

  return (
    <section
      aria-label={t('cookieConsent.regionLabel')}
      data-testid="cookie-banner"
      className="fixed inset-x-0 bottom-0 z-40 p-3 sm:p-4"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-sand-200 bg-surface p-4 shadow-soft sm:p-5">
        <h2 id="cookie-banner-title" className="text-base font-semibold text-ink-900">
          {t('cookieConsent.bannerTitle')}
        </h2>
        <p className="text-sm text-ink-700">
          {t('cookieConsent.bannerText')}{' '}
          <Link href={config.documents.cookies.path} className="font-medium text-link underline underline-offset-2">
            {t('cookieConsent.policyLink')}
          </Link>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={openSettings}>
            {t('cookieConsent.customize')}
          </Button>
          <Button onClick={rejectOptional}>{t('cookieConsent.rejectOptional')}</Button>
          <Button onClick={acceptAll}>{t('cookieConsent.acceptAll')}</Button>
        </div>
      </div>
    </section>
  );
}
