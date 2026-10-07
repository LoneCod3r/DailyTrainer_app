'use client';

import Link from 'next/link';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';
import { LEGAL_DOCUMENT_IDS } from '@/modules/legal/types';
import type { DictKey } from '@/lib/i18n/dictionaries';
import { useLegal } from './LegalProvider';
import { CookieSettingsButton } from './CookieSettingsButton';

const LABEL_KEYS: Record<(typeof LEGAL_DOCUMENT_IDS)[number], DictKey> = {
  terms: 'legal.terms',
  privacy: 'legal.privacy',
  cookies: 'legal.cookies',
};

const linkClass = 'rounded text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline';

// Public footer for the main app shell and the auth pages. Deliberately
// small: the legal links, cookie settings and the app name. It holds no
// company details (those belong in the approved documents; see
// modules/legal/company.ts).
export function SiteFooter({ appName, className }: { appName: string; className?: string }) {
  const t = useT();
  const { config } = useLegal();

  return (
    <footer className={clsx('border-t border-sand-200 bg-page', className)}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <nav aria-label={t('legal.footerNavLabel')}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {/* Community (Discussions/Courses/Meetings) left the primary nav
                in V1 (concept: Community is V2) — it stays reachable here. */}
            <li>
              <Link href="/community" className={linkClass}>
                {t('nav.community')}
              </Link>
            </li>
            {LEGAL_DOCUMENT_IDS.map((id) => (
              <li key={id}>
                <Link href={config.documents[id].path} className={linkClass}>
                  {t(LABEL_KEYS[id])}
                </Link>
              </li>
            ))}
            <li>
              <CookieSettingsButton className={linkClass} />
            </li>
          </ul>
        </nav>
        <p className="text-xs text-ink-500">
          © {new Date().getFullYear()} {appName}
        </p>
      </div>
    </footer>
  );
}
