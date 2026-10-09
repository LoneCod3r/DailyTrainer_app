'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';
import { LEGAL_DOCUMENT_IDS } from '@/modules/legal/types';
import type { DictKey } from '@/lib/i18n/dictionaries';
import { useLegal } from './LegalProvider';
import { CookieSettingsButton } from './CookieSettingsButton';
import { NewsletterSignup } from '@/components/newsletter/NewsletterSignup';
import { SUPPORT_NAV } from '@/components/layout/nav';
import { isModeratorOnly } from '@/lib/permissions';
import { Button } from '@/components/ui';
import donateIcon from '@/donate_icon.png';

const LABEL_KEYS: Record<(typeof LEGAL_DOCUMENT_IDS)[number], DictKey> = {
  terms: 'legal.terms',
  privacy: 'legal.privacy',
  cookies: 'legal.cookies',
};

const linkClass = 'rounded text-ink-500 underline-offset-2 hover:text-ink-900 hover:underline';

// Top band columns on desktop, sized to their content: mission (widest, it
// holds a short paragraph) | Support Us | newsletter. Columns drop out when
// they don't apply — newsletter flag off (e.g. the auth layout), or a
// Moderator-only account (no support section). Stacked and centred below lg.
const TOP_GRID: Record<number, string> = {
  1: '',
  2: 'lg:grid-cols-[1.4fr_1fr]',
  3: 'lg:grid-cols-[1.4fr_1fr_1.2fr]',
};

// Public footer for the main app shell and the auth pages. Deliberately
// small: the legal links, cookie settings and the app name. It holds no
// company details (those belong in the approved documents; see
// modules/legal/company.ts).
export function SiteFooter({
  appName,
  className,
  showNewsletter = false,
}: {
  appName: string;
  className?: string;
  showNewsletter?: boolean;
}) {
  const t = useT();
  const { config } = useLegal();
  const { data: session } = useSession();
  // Guests see it too (the donation page sends them through login first);
  // Moderator-only staff never do — same rule the donation page enforces.
  const showSupport = !(session?.user && isModeratorOnly(session.user.role));

  const columns = 1 + (showSupport ? 1 : 0) + (showNewsletter ? 1 : 0);

  return (
    <footer className={clsx('border-t border-sand-200 bg-page', className)}>
      {/* Full-width band; the inner box uses the same width/padding as the
          links row below (and the page Container) so both line up. Desktop:
          three columns on one shared left edge, top-aligned; mobile: stacked
          and centred. */}
      <div className="border-b border-sand-200 bg-sand-50/60">
        <div
          className={clsx(
            'mx-auto grid w-full max-w-6xl gap-12 px-4 py-12 text-center sm:px-6 sm:py-14 lg:items-start lg:gap-16 lg:px-8 lg:text-left',
            TOP_GRID[columns],
          )}
        >
          {/* Mission: logo, the italic serif tagline, and a short,
              restrained paragraph on the KUKO WAY philosophy. */}
          <div className="flex flex-col items-center gap-4 lg:items-start">
            <Link
              href="/"
              aria-label={appName}
              className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight text-ink-900"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg text-white">
                {appName.charAt(0).toUpperCase()}
              </span>
              <span>{appName}</span>
            </Link>
            {/* No background of its own: white on the dark footer in dark
                mode; in light mode the site's dark ink, since white would
                vanish on the light sand band. */}
            <p className="text-balance font-serif text-2xl italic leading-tight text-ink-900 dark:text-white sm:text-3xl lg:text-2xl xl:text-3xl">
              {t('footer.brandStatement')}
            </p>
            <p className="max-w-md text-sm leading-relaxed text-ink-500">{t('footer.brandMission')}</p>
          </div>

          {/* Support Us: an inviting call to action with the site's own button
              (same Link + Button pattern used across the app), then a short,
              quieter reason. Guests reach it through login; hidden for
              Moderator-only staff, like the donation page itself. */}
          {showSupport && (
            <div className="flex flex-col items-center gap-4 lg:text-center">
              {/* The site's standard (primary) button, unstyled further. */}
              <Link href={SUPPORT_NAV.href}>
                <Button>{t(SUPPORT_NAV.labelKey)}</Button>
              </Link>
              {/* Decorative (the button already says it), so empty alt. The
                  asset is black on opaque white: multiply drops the white into
                  the light band; in dark mode it's inverted and screened, so it
                  shows as a white glyph on the dark band. */}
              <Image
                src={donateIcon}
                alt=""
                className="h-auto w-16 object-contain mix-blend-multiply dark:mix-blend-screen dark:invert sm:w-20"
              />
              <p className="-mt-2 max-w-xs text-sm leading-relaxed text-ink-500">
                {t('footer.supportText')} {t('footer.supportEvery')}
              </p>
            </div>
          )}

          {showNewsletter && <NewsletterSignup />}
        </div>
      </div>
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
        <p className="shrink-0 text-xs text-ink-500">
          © {new Date().getFullYear()} {appName}. {t('footer.rightsReserved')}
        </p>
      </div>
    </footer>
  );
}
