import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, Card, CardContent, Badge, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { YourProgressStats } from '@/components/practices/YourProgressStats';
import { PracticeCard } from '@/components/practices/PracticeCard';
import { ProgramProgressList } from '@/components/journey/ProgramProgressList';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT, type DictKey } from '@/lib/i18n/dictionaries';
import { formatDate } from '@/lib/format-date';
import { getPracticeBySlug } from '@/modules/kuko-way/service';
import { localize, type Practice } from '@/modules/kuko-way/types';
import { listFavoritePracticeSlugs, listRecentPracticeSessions } from '@/modules/kuko-way/progress.service';
import { getProgramProgressOverview, listRecentDayReflections } from '@/modules/programs/progress.service';
import { getVisibleProgram } from '@/modules/programs/service';

// Page title and subtitle beside the stat cards on wide screens (2 of 5
// columns for the title, 3 for the stats), stacked above them below lg.
const JOURNEY_HERO = 'grid gap-6 lg:grid-cols-5 lg:items-center';

// One card per dashboard section (programs, recent practice, notes, favorites).
const DASHBOARD_CARD = 'flex flex-col gap-3 p-5';
const DASHBOARD_TITLE = 'font-serif text-xl text-ink-900';

export function generateMetadata(): Metadata {
  const t = getT(getLocale());
  return { title: t('journey.pageTitle'), description: t('journey.pageSubtitle') };
}

// Journey (KUKO WAY concept §10): your practice over time — days of showing
// up, measured minutes, program progress, the private before/after check-ins
// and notes (the "body awareness journal", §9), and favorites. Everything
// below the stats is account data, read for the signed-in user only.
// Signed-out visitors see this device's numbers and an invitation to keep
// their journey in a free account.
export default async function JourneyPage() {
  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const t = getT(locale);

  if (!session?.user) {
    return (
      <Container className="flex flex-col gap-8 py-8">
        <div className={JOURNEY_HERO}>
          <div className="lg:col-span-2">
            <PageHeader title={t('journey.pageTitle')} description={t('journey.pageSubtitle')} />
          </div>
          <div className="flex flex-col gap-3 lg:col-span-3">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <YourProgressStats variant="cards" />
            </div>
            <p className="text-sm text-ink-500">{t('journey.deviceNote')}</p>
          </div>
        </div>
        <Card className="bg-brand-tint">
          <CardContent className="flex flex-col items-start gap-3">
            <h2 className="font-serif text-2xl text-ink-900">{t('journey.accountInviteTitle')}</h2>
            <p className="max-w-xl text-ink-700">{t('journey.accountInviteDesc')}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button>{t('practiceSession.createAccount')}</Button>
              </Link>
              <Link href="/login?callbackUrl=/journey">
                <Button variant="secondary">{t('topbar.login')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const userId = session.user.id;
  const [recent, favoriteSlugs, programRows, reflections] = await Promise.all([
    listRecentPracticeSessions(userId, 12),
    listFavoritePracticeSlugs(userId),
    getProgramProgressOverview(userId),
    listRecentDayReflections(userId, 6),
  ]);
  const favorites = favoriteSlugs.map((slug) => getPracticeBySlug(slug)).filter((p): p is Practice => Boolean(p));
  const practiceTitle = (slug: string) => {
    const practice = getPracticeBySlug(slug);
    return practice ? localize(practice.title, locale).value : slug;
  };
  const notes = recent.filter((s) => s.note);

  return (
    <Container className="flex flex-col gap-8 py-6">
      <div className={JOURNEY_HERO}>
        <div className="lg:col-span-2">
          <PageHeader title={t('journey.pageTitle')} description={t('journey.pageSubtitle')} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-3">
          <YourProgressStats showMinutes variant="cards" />
        </div>
      </div>

      {/* Dashboard: two cards per row on wide screens, one column below lg.
          Paired by typical size: programs | favorites (short), then recent
          practice | notes (lists). Each heading stays a direct child of its
          card, next to the content. */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={DASHBOARD_CARD}>
          <h2 className={DASHBOARD_TITLE}>{t('journey.programsTitle')}</h2>
          <ProgramProgressList rows={programRows} locale={locale} t={t} variant="card" />
        </Card>

        <Card className={DASHBOARD_CARD}>
          <h2 className={DASHBOARD_TITLE}>{t('journey.favoritesTitle')}</h2>
          {favorites.length === 0 ? (
            <p className="text-ink-500">{t('journey.favoritesEmpty')}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {favorites.map((p) => (
                <PracticeCard key={p.id} practice={p} locale={locale} t={t} />
              ))}
            </div>
          )}
        </Card>

        <Card className={DASHBOARD_CARD}>
          <h2 className={DASHBOARD_TITLE}>{t('journey.recentTitle')}</h2>
          {recent.length === 0 ? (
            <div className="flex flex-1 flex-col items-start justify-between gap-4">
              <p className="text-ink-700">{t('journey.recentEmpty')}</p>
              <Link href="/practices" className="font-medium text-link hover:underline">
                {t('journey.startPracticeCta')} →
              </Link>
            </div>
          ) : (
            <ul className="-mx-5 -mb-5 flex flex-col divide-y divide-sand-200 border-t border-sand-200" data-testid="recent-practice">
              {recent.map((s) => (
                <li key={s.id} className="flex flex-col gap-1.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col">
                    <Link href={`/practices/${s.practiceSlug}`} className="font-medium text-ink-900 hover:text-link">
                      {practiceTitle(s.practiceSlug)}
                    </Link>
                    <span className="text-sm text-ink-500">
                      {formatDate(s.completedAt, locale)}
                      {s.durationSec ? ` · ${t('journey.minutesShort', { count: Math.max(1, Math.round(s.durationSec / 60)) })}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {s.preFeelings.map((f) => (
                      <Badge key={f} tone="neutral">
                        {t('journey.before')}: {t(`practiceSession.pre.${f}` as DictKey)}
                      </Badge>
                    ))}
                    {s.postFeeling && (
                      <Badge tone="brand">
                        {t('journey.after')}: {t(`practiceSession.post.${s.postFeeling}` as DictKey)}
                      </Badge>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className={DASHBOARD_CARD}>
          <h2 className={DASHBOARD_TITLE}>{t('journey.notesTitle')}</h2>
          <p className="-mt-2 text-sm text-ink-500">{t('journey.notesPrivate')}</p>
          {notes.length === 0 && reflections.length === 0 ? (
            <p className="text-ink-500">{t('journey.notesEmpty')}</p>
          ) : (
            <ul className="grid gap-3" data-testid="journey-notes">
              {notes.map((s) => (
                <li key={s.id} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
                  <p className="text-sm text-ink-500">
                    {practiceTitle(s.practiceSlug)} · {formatDate(s.completedAt, locale)}
                  </p>
                  <p className="mt-1 whitespace-pre-line text-ink-900">{s.note}</p>
                </li>
              ))}
              {reflections.map((r) => {
                const program = getVisibleProgram(r.programSlug);
                return (
                  <li key={r.id} className="rounded-2xl border border-sand-200 bg-sand-50 p-4">
                    <p className="text-sm text-ink-500">
                      {t('journey.dayReflection', {
                        program: program ? localize(program.title, locale).value : r.programSlug,
                        day: r.day,
                      })}
                      {r.feeling ? ` · ${t(`practiceSession.post.${r.feeling}` as DictKey)}` : ''}
                    </p>
                    {r.note && <p className="mt-1 whitespace-pre-line text-ink-900">{r.note}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </Container>
  );
}
