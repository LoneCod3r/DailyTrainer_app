import Link from 'next/link';
import Image from 'next/image';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { clsx } from '@/lib/clsx';
import { Container, Card, CardContent, Badge, Button, EmptyState } from '@/components/ui';
import { ProgressBar } from '@/components/practices/ProgressBar';
import { YourProgressStats } from '@/components/practices/YourProgressStats';
import { MeetingStatusBadge } from '@/components/meetings/MeetingStatusBadge';
import { JoinMeetingButton } from '@/components/meetings/JoinMeetingButton';
import { MembershipStrip } from '@/components/account/MembershipStrip';
import { listPublishedContent } from '@/modules/content/content.service';
import { getActiveSubscriptionForUser } from '@/modules/membership/membership.service';
import { getLocale } from '@/lib/i18n/get-locale';
import type { Locale } from '@/lib/i18n/locale';
import { getT } from '@/lib/i18n/dictionaries';
import { toBulgarianCyrillic } from '@/lib/i18n/transliterate';
import { getStartHereSectionBySlug } from '@/modules/kuko-way/service';
import { getProgramProgressOverview } from '@/modules/programs/progress.service';
import { localize } from '@/modules/kuko-way/types';
import { getNextUpcomingMeeting, getMeetingStatus } from '@/modules/events/service';
import { formatDateTime } from '@/lib/format-date';
import { isModeratorOnly } from '@/lib/permissions';
import { features } from '@/lib/features';

// Home v2 — moves away from "sidebar + topbar + cards + progress widget"
// toward an editorial, movement/body-oriented composition (visual/UX
// direction requested by the client, referencing humangarage.net for
// structure only — no HG text, imagery, layout code, or branding was
// copied; every string/asset here is KUKO WAY's own). No routes, data,
// i18n keys, or business logic changed — same session/locale/content
// wiring as before, just a different visual composition around it. The
// "continue" program is the signed-in user's real, started Reset Program
// (modules/programs/progress.service.ts); streak/practice numbers come from
// the hybrid progress facade (YourProgressStats), account-wide. The progress
// section is signed-in only; visitors' device numbers live on /journey.
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
    image: '/images/home/library.jpeg',
  },
] as const;

// The hero banner has its text baked into the artwork, so each locale gets
// its own rendition of the same design (sources/credits:
// public/images/home/CREDITS.md).
const HERO_BANNER: Record<Locale, string> = {
  bg: '/images/home/home-page-banner-bg.webp',
  en: '/images/home/home-page-banner-en.webp',
};

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const t = getT(locale);
  const latest = await listPublishedContent({ type: 'ARTICLE', limit: 3 });
  const nextMeeting = getNextUpcomingMeeting();
  // Moderator is project staff, not a customer — never gets the
  // membership join/manage CTA (see lib/permissions.ts's isModeratorOnly).
  const isStaffModerator = Boolean(session?.user && isModeratorOnly(session.user.role));
  const subscription = session?.user && !isStaffModerator ? await getActiveSubscriptionForUser(session.user.id) : null;

  const firstName = session?.user?.name?.split(' ')[0];
  const greetingName = firstName && locale === 'bg' ? toBulgarianCyrillic(firstName) : firstName;
  // The first started, unfinished program — real enrollment, not a default.
  const activeProgram = session?.user
    ? (await getProgramProgressOverview(session.user.id)).find((row) => !row.complete)
    : undefined;

  // Signed-out visitors get a motivational line drawn from the real "Our
  // Beliefs" handbook content (modules/kuko-way/content/start-here.ts) —
  // not invented marketing copy — instead of a personalized greeting.
  const beliefsQuote = getStartHereSectionBySlug('nashite-ubezhdeniya')?.paragraphs?.[4];

  return (
    <div className="flex flex-col">
      {/* Hero — the client's finished "Фасциални маневри" banner shown as
          a complete image, in the active locale's rendition (HERO_BANNER):
          its title, subtitle, logo and footer strip are baked into the
          artwork, so nothing is overlaid on it (no scrim, no text, no CTA) —
          anything layered on top would collide with that embedded text.
          The image is laid out at its own 1672×941 shape (w-full h-auto),
          so it is never cropped or letterboxed and no container background
          can show around it. It spans the full viewport width at every
          screen size (edge to edge, square corners), per the client's
          reference: left/right to the screen edges, height following the
          artwork's shape. The heading keeps the section's
          usual side padding. */}
      <section className="bg-sand-50/60 pt-8 sm:pt-10">
        {/* The page's one <h1> (a11y: single top-level heading) lives
            above the banner as plain dark text on the page background, in
            both states: the signed-in greeting, or for visitors a real
            KUKO WAY philosophy line from the "Our Beliefs" handbook. */}
        {session ? (
          <h1 className="mb-4 px-4 text-xl font-serif text-ink-900 sm:mb-6 sm:px-6 sm:text-2xl lg:px-10 lg:text-3xl">
            {greetingName ? t('home.welcomeBack', { name: greetingName }) : t('home.welcome')}
          </h1>
        ) : (
          <h1 className="mb-4 px-4 font-serif text-xl italic leading-[1.2] text-ink-900 sm:mb-6 sm:px-6 sm:text-2xl lg:px-10 lg:text-3xl">
            “{beliefsQuote ? localize(beliefsQuote, locale).value : t('home.welcome')}”
          </h1>
        )}
        <Image
          src={HERO_BANNER[locale]}
          alt={t('home.heroBannerAlt')}
          width={1672}
          height={941}
          priority
          sizes="100vw"
          className="block h-auto w-full"
        />
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
                <div className="flex flex-1 flex-col gap-2">
                  <span className="font-serif text-3xl text-ink-900 sm:text-4xl">{t(item.labelKey)}</span>
                  <span className="max-w-md text-base text-ink-500 sm:text-lg">{t(item.descKey)}</span>
                  <span className="pt-1 text-base font-medium text-link motion-safe:transition-transform motion-safe:group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Progress — a continuation-of-practice moment: your program by
            name, a slim day-progress line, and your real streak/completed
            numbers set as typography rather than stat tiles. Signed-in only:
            for visitors it was an empty "no program / 0 days" panel. */}
        {session && (
          <section className="flex flex-col gap-6 border-t border-sand-200 pt-14 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
            <div className="flex flex-1 flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('home.yourProgress')}</h2>
              {activeProgram ? (
                <>
                  <p className="font-serif text-3xl text-ink-900 sm:text-4xl">
                    {t('home.continueProgram')} — {localize(activeProgram.program.title, locale).value}
                  </p>
                  <div className="flex max-w-xs flex-col gap-1.5">
                    <ProgressBar
                      value={activeProgram.completedDays}
                      max={activeProgram.totalDays}
                      label={t('journey.daysCompleted', { count: activeProgram.completedDays, total: activeProgram.totalDays })}
                    />
                    <p className="text-xs text-ink-500">
                      {t('journey.daysCompleted', { count: activeProgram.completedDays, total: activeProgram.totalDays })}
                    </p>
                  </div>
                  <Link
                    href={`/practices/programs/${activeProgram.program.slug}/day/${activeProgram.currentDay}`}
                    className="w-fit pt-1"
                  >
                    <Button variant="secondary" size="sm">
                      {t('home.continue')}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-base text-ink-500">{t('home.noActiveProgram')}</p>
                  <Link href="/practices/programs" className="w-fit text-base font-medium text-link hover:underline">
                    {t('home.chooseProgram')} →
                  </Link>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:border-l sm:border-sand-200 sm:pl-10">
              <div className="flex gap-10">
                <YourProgressStats />
              </div>
              <Link href="/journey" className="w-fit text-sm font-medium text-link hover:underline">
                {t('practiceSession.viewJourney')} →
              </Link>
            </div>
          </section>
        )}

        {/* Membership sales are off in V1 (lib/features.ts); existing
            subscribers still see their plan. */}
        {session && !isStaffModerator && (features.membershipSales || subscription) && (
          <MembershipStrip subscription={subscription} locale={locale} t={t} />
        )}

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
