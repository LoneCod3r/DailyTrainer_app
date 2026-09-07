import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from '@/components/ui';
import { ProgramTrail } from '@/components/practices/ProgramTrail';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export function generateMetadata(): Metadata {
  const t = getT(getLocale());
  return { title: t('practices.pageTitle'), description: t('practices.pageSubtitle') };
}

// Practices is the core personal experience: Practices → category →
// practice/program → practice session. This page is the "category" level —
// it deliberately does not attempt any recommendation logic yet.
//
// Redesigned (per design/UX audit) from a flat 6-card grid into three
// weighted zones so Start Here reads as the entry point, 7/14/28 read as one
// ascending journey rather than independent plans, and Library reads as a
// quieter reference destination — instead of six visually identical cards.
export default function PracticesPage() {
  const locale = getLocale();
  const t = getT(locale);

  return (
    <Container className="flex flex-col gap-10 py-8 sm:gap-14">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">{t('practices.pageTitle')}</h1>
        <p className="mt-1 text-sm text-ink-500">{t('practices.pageSubtitle')}</p>
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

      {/* Programs — one connected trail (see ProgramTrail) instead of three
          identical cards, so 7/14/28 read as ascending steps of one journey. */}
      <section className="flex flex-col gap-8 border-t border-sand-200 pt-10 sm:pt-14">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-link">{t('nav.practices')}</p>
          <h2 className="mt-1 font-serif text-2xl text-ink-900 sm:text-3xl">{t('practices.programsTitle')}</h2>
          <p className="mt-1 max-w-lg text-sm text-ink-500 sm:text-base">{t('practices.programsDesc')}</p>
        </div>
        <ProgramTrail />
      </section>

      {/* Library — deliberately the quietest zone: a plain text row, no
          photo, no card, signaling "reference shelf" rather than featured
          content. */}
      <section className="border-t border-sand-200 pt-10 sm:pt-14">
        <Link href="/practices/library" className="group flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-xl text-ink-900 group-hover:text-link sm:text-2xl">
              {t('practices.libraryTitle')}
            </h2>
            <p className="max-w-md text-sm text-ink-500">{t('practices.libraryDesc')}</p>
          </div>
          <span
            aria-hidden="true"
            className="shrink-0 text-lg font-medium text-link motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </section>
    </Container>
  );
}
