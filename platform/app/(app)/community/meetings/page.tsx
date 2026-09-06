import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { MeetingCard } from '@/components/meetings/MeetingCard';
import { getUpcomingMeetings, getPastMeetings } from '@/modules/events/service';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export default function MeetingsPage() {
  const locale = getLocale();
  const t = getT(locale);
  const upcoming = getUpcomingMeetings();
  const past = getPastMeetings();

  return (
    <Container className="flex flex-col gap-10 py-8">
      <PageHeader eyebrow={t('nav.community')} title={t('meetings.pageTitle')} description={t('meetings.pageSubtitle')} />

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-ink-900">{t('meetings.upcomingTitle')}</h2>
        {upcoming.length === 0 ? (
          <EmptyState title={t('meetings.emptyUpcomingTitle')} description={t('meetings.emptyUpcomingDesc')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((meeting) => (
              <MeetingCard key={meeting.slug} meeting={meeting} locale={locale} t={t} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-ink-900">{t('meetings.pastTitle')}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((meeting) => (
              <MeetingCard key={meeting.slug} meeting={meeting} locale={locale} t={t} emphasize={false} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
