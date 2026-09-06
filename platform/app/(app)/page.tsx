import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, Card, CardContent, Badge, Button, EmptyState } from '@/components/ui';
import { ProgramDayProgress } from '@/components/practices/ProgramDayProgress';
import { YourProgressStats } from '@/components/practices/YourProgressStats';
import { MeetingStatusBadge } from '@/components/meetings/MeetingStatusBadge';
import { JoinMeetingButton } from '@/components/meetings/JoinMeetingButton';
import { listPublishedContent } from '@/modules/content/content.service';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getPracticeById, getProgramBySlug } from '@/modules/kuko-way/service';
import { demoProgress } from '@/modules/kuko-way/demo-progress';
import { localize } from '@/modules/kuko-way/types';
import { getNextUpcomingMeeting, getMeetingStatus } from '@/modules/events/service';
import { formatDateTime } from '@/lib/format-date';

// Home answers one question: "what should I do today?" Today's Practice is
// the visual anchor; everything else supports it. Which program is "active"
// is still a fixed demo default (see modules/kuko-way/demo-progress.ts) —
// there's no real enrollment flow yet — but every number shown about your
// progress on it (day X of N, streak, completed count) is real, derived
// from this device's own completion history (see lib/local-progress.ts,
// ProgramDayProgress, YourProgressStats), not placeholder data. Latest
// Information reuses the real Day 1 content feed as-is.
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

  return (
    <Container className="flex flex-col gap-10 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          {firstName ? t('home.welcomeBack', { name: firstName }) : t('home.welcome')}
        </h1>
        <p className="mt-1 text-sm text-ink-500">{t('home.subtitle')}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-col gap-3">
            <Badge tone="brand" className="w-fit">
              {t('home.todaysPractice')}
            </Badge>
            <h2 className="text-lg font-semibold text-ink-900">{practiceTitle?.value ?? t('home.todaysPracticeFallbackTitle')}</h2>
            <p className="text-sm text-ink-500">{practiceSummary?.value ?? t('home.todaysPracticeFallbackDesc')}</p>
            <div>
              <Link href={todaysPractice ? `/practices/${todaysPractice.slug}` : '/practices/start-here'}>
                <Button>{t('home.startPractice')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-ink-900">{t('home.continueProgram')}</h2>
            {activeProgram ? (
              <>
                <p className="text-sm text-ink-500">{localize(activeProgram.title, locale).value}</p>
                <ProgramDayProgress programLength={activeProgram.length} />
                <div>
                  <Link href={`/practices/programs/${activeProgram.slug}`}>
                    <Button variant="secondary" size="sm">
                      {t('home.continue')}
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-ink-500">{t('home.noActiveProgram')}</p>
                <Link href="/practices" className="text-sm font-medium text-link hover:underline">
                  {t('home.chooseProgram')} →
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-ink-900">{t('home.quickAccess')}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/practices/start-here">
            <Card className="flex h-full flex-col gap-1 p-5 transition-shadow hover:shadow-soft">
              <span className="font-medium text-ink-900">{t('nav.startHere')}</span>
              <span className="text-sm text-ink-500">{t('practices.startHereDesc')}</span>
            </Card>
          </Link>
          <Link href="/practices/feel-better-now">
            <Card className="flex h-full flex-col gap-1 p-5 transition-shadow hover:shadow-soft">
              <span className="font-medium text-ink-900">{t('nav.feelBetterNow')}</span>
              <span className="text-sm text-ink-500">{t('practices.feelBetterNowDesc')}</span>
            </Card>
          </Link>
          <Link href="/practices/library">
            <Card className="flex h-full flex-col gap-1 p-5 transition-shadow hover:shadow-soft">
              <span className="font-medium text-ink-900">{t('nav.library')}</span>
              <span className="text-sm text-ink-500">{t('practices.libraryDesc')}</span>
            </Card>
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-ink-900">{t('home.yourProgress')}</h2>
        <Card>
          <CardContent className="flex flex-wrap gap-8">
            <YourProgressStats />
            {activeProgram && (
              <div>
                <p className="text-xl font-semibold text-ink-900">{localize(activeProgram.title, locale).value}</p>
                <p className="text-xs text-ink-500">{t('home.activeProgram')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink-900">{t('home.latestInfo')}</h2>
          <Link href="/blog" className="text-sm font-medium text-link hover:underline">
            {t('home.viewBlog')}
          </Link>
        </div>
        {latest.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {latest.map((item) => (
              <Link key={item.id} href={`/blog/${item.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-soft">
                  <CardContent>
                    {item.featured && (
                      <Badge tone="brand" className="mb-2">
                        {t('home.featured')}
                      </Badge>
                    )}
                    <h3 className="font-medium text-ink-900">{item.title}</h3>
                    {item.excerpt && <p className="mt-1 line-clamp-2 text-sm text-ink-500">{item.excerpt}</p>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title={t('home.noArticlesTitle')} description={t('home.noArticlesDesc')} />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-ink-900">{t('home.upcomingMeeting')}</h2>
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
  );
}
