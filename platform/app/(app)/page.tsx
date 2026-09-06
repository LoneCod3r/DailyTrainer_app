import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clsx } from '@/lib/clsx';
import { Container, Card, CardContent, Badge, Button, EmptyState } from '@/components/ui';
import { ProgramDayProgress } from '@/components/practices/ProgramDayProgress';
import { YourProgressStats } from '@/components/practices/YourProgressStats';
import { MeetingStatusBadge } from '@/components/meetings/MeetingStatusBadge';
import { JoinMeetingButton } from '@/components/meetings/JoinMeetingButton';
import { listPublishedContent } from '@/modules/content/content.service';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getPracticeById, getProgramBySlug, getStartHereSectionBySlug } from '@/modules/kuko-way/service';
import { demoProgress } from '@/modules/kuko-way/demo-progress';
import { localize } from '@/modules/kuko-way/types';
import { getNextUpcomingMeeting, getMeetingStatus } from '@/modules/events/service';
import { formatDateTime } from '@/lib/format-date';

// Home v2 — moves away from "sidebar + topbar + cards + progress widget"
// toward an editorial, movement/body-oriented composition (visual/UX
// direction requested by the client, referencing humangarage.net for
// structure only — no HG text, imagery, layout code, or branding was
// copied; every string/asset here is KUKO WAY's own). No routes, data,
// i18n keys, or business logic changed — same session/locale/content
// wiring as before, just a different visual composition around it. Which
// program is "active" is still a fixed demo default (see modules/kuko-way/
// demo-progress.ts) — there's no real enrollment flow yet — but every
// number about progress on it (day X of N, streak, completed count) is
// real, derived from this device's own completion history (see
// lib/local-progress.ts, ProgramDayProgress, YourProgressStats).
// Photography credit/license: public/images/home/CREDITS.md — placeholder
// imagery until real KUKO WAY practice photography/video exists.
const EXPLORE_ITEMS = [
  {
    href: '/practices/start-here',
    labelKey: 'nav.startHere',
    descKey: 'practices.startHereDesc',
    image: '/images/home/explore-start-here.jpg',
  },
  {
    href: '/practices/feel-better-now',
    labelKey: 'nav.feelBetterNow',
    descKey: 'practices.feelBetterNowDesc',
    image: '/images/home/explore-feel-better-now.jpg',
  },
  {
    href: '/practices/library',
    labelKey: 'nav.library',
    descKey: 'practices.libraryDesc',
    image: '/images/home/explore-library.jpg',
  },
] as const;

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const t = getT(locale);
  const latest = await listPublishedContent({ type: 'ARTICLE', limit: 3 });
  const nextMeeting = getNextUpcomingMeeting();

  const firstName = session?.user?.name?.split(' ')[0];
  const todaysPractice = getPracticeById('body-scan-1');
  const activeProgram = getProgramBySlug(demoProgress.activeProgramSlug);

  const practiceTitle = todaysPractice ? localize(todaysPractice.title, locale) : undefined;
  const practiceSummary = todaysPractice?.intro?.[0] ? localize(todaysPractice.intro[0], locale) : undefined;
  const practiceStepCount = todaysPractice?.instructions?.reduce((n, group) => n + group.steps.length, 0);
  const practiceHref = todaysPractice ? `/practices/${todaysPractice.slug}` : '/practices/start-here';

  // Signed-out visitors get a motivational line drawn from the real "Our
  // Beliefs" handbook content (modules/kuko-way/content/start-here.ts) —
  // not invented marketing copy — instead of a personalized practice card
  // that doesn't apply to them yet.
  const beliefsQuote = getStartHereSectionBySlug('nashite-ubezhdeniya')?.paragraphs?.[4];

  return (
    <div className="flex flex-col">
      {/* Hero — full-bleed (breaks out of the standard content column for a
          more immersive, less "dashboard" first impression), warm tonal
          wash instead of a flat green block. Greeting stays the page's one
          <h1> (a11y: single top-level heading); the practice title is the
          visually dominant element, matching the "editorial headline over
          personal kicker" pattern rather than a same-size UI label. */}
      <section className="border-b border-sand-200 bg-sand-50/60 px-4 py-10 sm:px-6 sm:py-14 lg:px-10 lg:py-20 xl:px-16">
        <div className="mx-auto grid max-w-[90rem] gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          {session ? (
            // Signed in: the personal, practice-specific experience.
            <div className="flex flex-col gap-5">
              <h1 className="text-base font-semibold uppercase tracking-wide text-link">
                {firstName ? t('home.welcomeBack', { name: firstName }) : t('home.welcome')}
              </h1>

              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600 font-serif text-sm text-white">
                  K
                </span>
                <Badge tone="brand" className="w-fit">
                  {t('home.todaysPractice')}
                </Badge>
              </div>

              <h2 className="max-w-lg text-5xl font-medium leading-[1.1] text-ink-900 sm:text-6xl lg:text-7xl">
                {practiceTitle?.value ?? t('home.todaysPracticeFallbackTitle')}
              </h2>
              <p className="max-w-md text-lg leading-relaxed text-ink-700 sm:text-xl">
                {practiceSummary?.value ?? t('home.todaysPracticeFallbackDesc')}
              </p>

              <div className="flex flex-wrap items-center gap-5 pt-2">
                <Link href={practiceHref} className="motion-safe:transition-transform motion-safe:hover:-translate-y-0.5">
                  <Button size="lg">{t('home.startPractice')}</Button>
                </Link>
                {!!practiceStepCount && (
                  <span className="text-base text-ink-500">
                    {practiceStepCount} {t('common.steps')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            // Signed out: an inspirational entry point (real KUKO WAY
            // philosophy, not a personalized dashboard that doesn't apply
            // yet) — closer to how app.humangarage.net greets a visitor.
            <div className="flex flex-col gap-6">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-600 font-serif text-sm text-white">
                K
              </span>
              <h1 className="max-w-lg font-serif text-4xl italic leading-[1.15] text-ink-900 sm:text-5xl lg:text-6xl">
                “{beliefsQuote ? localize(beliefsQuote, locale).value : t('home.welcome')}”
              </h1>
              <p className="text-sm font-semibold uppercase tracking-wide text-ink-500">KUKO WAY</p>
              <div className="flex flex-wrap items-center gap-5 pt-2">
                <Link href="/practices/start-here" className="motion-safe:transition-transform motion-safe:hover:-translate-y-0.5">
                  <Button size="lg">{t('nav.startHere')}</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Large visual area for the practice — placeholder photography
              (license: public/images/home/CREDITS.md) until real KUKO WAY
              photography/video exists. A dark gradient scrim keeps the
              "KUKO WAY" mark readable over any photo, in both themes. */}
          <div className="relative isolate aspect-[16/11] w-full overflow-hidden rounded-2xl bg-ink-900 lg:aspect-[4/5]">
            <Image
              src="/images/home/hero-todays-practice.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-black/10" />
            <span aria-hidden="true" className="absolute bottom-5 left-5 font-serif text-sm text-white/90">
              KUKO WAY
            </span>
          </div>
        </div>
      </section>

      <Container className="flex flex-col gap-16 py-14 sm:gap-20 sm:py-20">
        {/* Explore — alternating editorial rows (numeral + heading on one
            side, a small tonal swatch on the other, flipping per row)
            instead of a list of identical boxes. */}
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('home.quickAccess')}</h2>
          <div className="flex flex-col divide-y divide-sand-200">
            {EXPLORE_ITEMS.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'group flex flex-col items-start gap-6 py-8 sm:flex-row sm:items-center sm:gap-10',
                  i % 2 === 1 && 'sm:flex-row-reverse',
                )}
              >
                <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-2xl bg-sand-100 sm:h-32 sm:w-44">
                  <Image
                    src={item.image}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 11rem, 100vw"
                    className="object-cover motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 items-start gap-5">
                  <span className="font-serif text-4xl text-ink-300 sm:text-5xl">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex flex-col gap-2">
                    <span className="font-serif text-3xl text-ink-900 sm:text-4xl">{t(item.labelKey)}</span>
                    <span className="max-w-md text-base text-ink-500 sm:text-lg">{t(item.descKey)}</span>
                    <span className="pt-1 text-base font-medium text-link motion-safe:transition-transform motion-safe:group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Progress — a continuation-of-practice moment: your program by
            name, a slim day-progress line, and your real streak/completed
            numbers set as typography rather than stat tiles. Same
            data/logic as before (lib/local-progress.ts). */}
        <section className="flex flex-col gap-6 border-t border-sand-200 pt-14 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
          <div className="flex flex-1 flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('home.yourProgress')}</h2>
            {activeProgram ? (
              <>
                <p className="font-serif text-3xl text-ink-900 sm:text-4xl">
                  {t('home.continueProgram')} — {localize(activeProgram.title, locale).value}
                </p>
                <div className="max-w-xs">
                  <ProgramDayProgress programLength={activeProgram.length} />
                </div>
                <Link href={`/practices/programs/${activeProgram.slug}`} className="w-fit pt-1">
                  <Button variant="secondary" size="sm">
                    {t('home.continue')}
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-base text-ink-500">{t('home.noActiveProgram')}</p>
                <Link href="/practices" className="w-fit text-base font-medium text-link hover:underline">
                  {t('home.chooseProgram')} →
                </Link>
              </>
            )}
          </div>

          <div className="flex gap-10 sm:border-l sm:border-sand-200 sm:pl-10">
            <YourProgressStats />
          </div>
        </section>

        {/* Latest information — an editorial list, not a card grid. */}
        <section className="flex flex-col gap-6 border-t border-sand-200 pt-14">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('home.latestInfo')}</h2>
            <Link href="/blog" className="text-base font-medium text-link hover:underline">
              {t('home.viewBlog')}
            </Link>
          </div>
          {latest.length > 0 ? (
            <div className="flex flex-col divide-y divide-sand-200">
              {latest.map((item) => (
                <Link key={item.id} href={`/blog/${item.slug}`} className="group flex flex-col gap-2 py-6 first:pt-0">
                  <div className="flex flex-wrap items-center gap-3">
                    {item.featured && <Badge tone="brand">{t('home.featured')}</Badge>}
                    <h3 className="font-serif text-2xl text-ink-900 group-hover:text-link sm:text-3xl">{item.title}</h3>
                  </div>
                  {item.excerpt && <p className="line-clamp-2 max-w-2xl text-base text-ink-500 sm:text-lg">{item.excerpt}</p>}
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title={t('home.noArticlesTitle')} description={t('home.noArticlesDesc')} />
          )}
        </section>

        <section className="flex flex-col gap-4 border-t border-sand-200 pt-14">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('home.upcomingMeeting')}</h2>
          {nextMeeting ? (
            <Card>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <MeetingStatusBadge status={getMeetingStatus(nextMeeting)} t={t} />
                  <span className="text-sm font-medium text-ink-700">{formatDateTime(nextMeeting.startAt, locale)}</span>
                </div>
                <h3 className="font-medium text-ink-900">{localize(nextMeeting.title, locale).value}</h3>
                <p className="text-sm text-ink-500">{t('meetings.hostedBy', { name: nextMeeting.hostName })}</p>
                <div className="flex items-center gap-3 pt-1">
                  <JoinMeetingButton meeting={nextMeeting} t={t} size="sm" />
                  <Link href="/community/meetings" className="text-sm font-medium text-link hover:underline">
                    {t('home.viewMeetings')}
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title={t('home.noMeetingTitle')}
              description={t('home.noMeetingDesc')}
              action={
                <Link href="/community/meetings" className="text-sm font-medium text-link hover:underline">
                  {t('home.viewMeetings')}
                </Link>
              }
            />
          )}
        </section>
      </Container>
    </div>
  );
}
