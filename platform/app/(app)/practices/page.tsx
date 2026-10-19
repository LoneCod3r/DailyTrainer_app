import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui';
import { ProgramTile } from '@/components/programs/ProgramTile';
import { getVisiblePrograms } from '@/modules/programs/service';
import { getPracticeOverview } from '@/modules/kuko-way/service';
import { localize } from '@/modules/kuko-way/types';
import { getLocale } from '@/lib/i18n/get-locale';
import type { Locale } from '@/lib/i18n/locale';
import { getT } from '@/lib/i18n/dictionaries';

export function generateMetadata(): Metadata {
  const t = getT(getLocale());
  return { title: t('practices.pageTitle'), description: t('practices.pageSubtitle') };
}

// The "welcome" photo carries no text, so one file serves both locales; its
// quote and welcome note are page text (sources/credits:
// public/images/practices/CREDITS.md).
const WELCOME_IMAGE = '/images/practices/welcome.webp';

// Each language's own quotation marks around the quote.
const QUOTE_MARKS: Record<Locale, [string, string]> = {
  bg: ['„', '“'],
  en: ['“', '”'],
};

// Practices is the core personal experience: Practices → category →
// practice/program → practice session. This page is the "category" level —
// it deliberately does not attempt any recommendation logic yet.
//
// Redesigned (per design/UX audit) from a flat 6-card grid into two weighted
// zones so Start Here reads as the entry point and 7/14/28 read as one
// ascending journey rather than independent plans — instead of six visually
// identical cards. Library isn't previewed here: it's already one tap away
// via the Practices dropdown in the global nav and has its own
// `/practices/library` page, so a third zone on this page would just repeat
// that entry point.
export default function PracticesPage() {
  const locale = getLocale();
  const t = getT(locale);
  const overview = getPracticeOverview();

  return (
    <Container className="flex flex-col gap-10 py-8 sm:gap-14">
      <div>
        <h1 className="font-serif text-4xl text-ink-900 sm:text-5xl">{t('practices.pageTitle')}</h1>
        <p className="mt-2 text-lg text-ink-700">{t('practices.pageSubtitle')}</p>
      </div>

      {/* Entry point — Start Here is the large tile so it's the obvious
          first move; Feel Better Now sits alongside as a smaller, secondary
          option for anyone who needs relief right now instead of onboarding. */}
      <section className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/practices/start-here"
          className="group relative flex-[2] overflow-hidden rounded-2xl bg-ink-900 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        >
          <div className="relative aspect-[4/3] w-full sm:aspect-auto sm:h-80">
            <Image
              src="/images/home/explore-start-here.jpg"
              alt=""
              fill
              sizes="(min-width: 640px) 60vw, 100vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
              <h2 className="font-serif text-2xl leading-tight text-white sm:text-4xl">{t('nav.startHere')}</h2>
              <p className="mt-2 max-w-sm text-sm text-white/85 sm:text-base">{t('practices.startHereDesc')}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-white motion-safe:transition-transform motion-safe:group-hover:translate-x-1">
                {t('nav.startHere')} →
              </span>
            </div>
          </div>
        </Link>

        <Link
          href="/practices/feel-better-now"
          className="group relative flex-1 overflow-hidden rounded-2xl bg-ink-900 motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
        >
          <div className="relative aspect-[4/3] w-full sm:aspect-auto sm:h-80">
            <Image
              src="/images/home/explore-feel-better-now.jpg"
              alt=""
              fill
              sizes="(min-width: 640px) 30vw, 100vw"
              className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10"
            />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h2 className="font-serif text-xl leading-tight text-white">{t('nav.feelBetterNow')}</h2>
              <p className="mt-1 max-w-xs text-sm text-white/85 line-clamp-2">{t('practices.feelBetterNowDesc')}</p>
            </div>
          </div>
        </Link>
      </section>

      {/* About the practice — the brochure's introduction and its five headed
          sections (modules/kuko-way/content/practice-overview.ts) beside the
          "welcome" photo, with the quote above the photo and the welcome note
          below it. Placed after the entry tiles so Start Here stays the first
          move, and before the programs. Phones: text first, then the photo
          column at a capped width; wider screens: photo column on the left. */}
      <section
        aria-labelledby="about-the-practice-title"
        data-testid="practices-about"
        className="flex flex-col gap-8 border-t border-sand-200 pt-10 sm:flex-row-reverse sm:items-start sm:gap-10 sm:pt-14"
      >
        <div className="flex flex-col gap-6 sm:flex-1">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-link">{t('nav.practices')}</p>
            <h2 id="about-the-practice-title" className="mt-1 font-serif text-2xl text-ink-900 sm:text-3xl">
              {t('practices.aboutTitle')}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink-700">{localize(overview.intro, locale).value}</p>
          </div>
          {overview.sections.map((section) => (
            <div key={section.id} data-testid="practices-about-section" className="mx-auto max-w-xl text-center">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-900">{localize(section.title, locale).value}</h3>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="mt-2 text-base leading-relaxed text-ink-700">
                  {localize(paragraph, locale).value}
                </p>
              ))}
            </div>
          ))}
        </div>
        {/* Desktop only: the photo column (quote, photo, welcome) starts ~6–7
            body lines lower than the text column (lg:mt-44 = 198px at the
            112.5% root size). */}
        <div className="mx-auto flex w-full max-w-xs flex-col gap-4 sm:mx-0 sm:w-64 sm:max-w-none sm:shrink-0 lg:mt-44 lg:w-[22.5rem]">
          <blockquote data-testid="practices-about-quote">
            <p className="text-balance text-center font-serif text-lg italic leading-snug text-ink-700">
              {QUOTE_MARKS[locale][0]}
              {localize(overview.quote, locale).value}
              {QUOTE_MARKS[locale][1]}
            </p>
          </blockquote>
          <Image
            src={WELCOME_IMAGE}
            alt={t('practices.welcomeImageAlt')}
            width={896}
            height={1200}
            // Rendered widths at the site's 112.5% root size: w-[22.5rem] /
            // w-64 / max-w-xs = 405 / 288 / 360 CSS px.
            sizes="(min-width: 1024px) 405px, (min-width: 640px) 288px, 360px"
            className="h-auto w-full rounded-2xl"
          />
          <div data-testid="practices-about-welcome" className="text-center">
            <h3 className="text-base font-semibold text-ink-900">{localize(overview.welcome.title, locale).value}</h3>
            <p className="mt-0.5 text-sm text-ink-500">{localize(overview.welcome.text, locale).value}</p>
          </div>
        </div>
      </section>

      {/* Reset Programs (1 / 3 / 7 / 28 days) — each opens its own overview;
          access to the days is checked server-side there. */}
      <section className="flex flex-col gap-8 border-t border-sand-200 pt-10 sm:pt-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-link">{t('nav.practices')}</p>
          <h2 className="mt-1 font-serif text-2xl text-ink-900 sm:text-3xl">{t('practices.programsTitle')}</h2>
          <p className="mt-1 max-w-lg text-sm text-ink-500 sm:text-base">{t('practices.programsDesc')}</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {getVisiblePrograms().map((program) => (
            <ProgramTile key={program.slug} program={program} locale={locale} t={t} />
          ))}
        </div>
      </section>
    </Container>
  );
}
