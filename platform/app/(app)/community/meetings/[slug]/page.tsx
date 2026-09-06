import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Card, CardContent } from '@/components/ui';
import { MeetingStatusBadge } from '@/components/meetings/MeetingStatusBadge';
import { JoinMeetingButton } from '@/components/meetings/JoinMeetingButton';
import { getMeetingBySlug, getMeetingStatus, getUpcomingMeetings } from '@/modules/events/service';
import { formatDateTime } from '@/lib/format-date';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { localize } from '@/modules/kuko-way/types';

export default function MeetingDetailPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const t = getT(locale);
  const meeting = getMeetingBySlug(params.slug);
  if (!meeting) notFound();

  const status = getMeetingStatus(meeting);
  const title = localize(meeting.title, locale);
  const description = localize(meeting.description, locale);
  const otherUpcoming = getUpcomingMeetings().filter((m) => m.slug !== meeting.slug);

  return (
    <Container className="flex max-w-2xl flex-col gap-6 py-8">
      <Link href="/community/meetings" className="text-sm font-medium text-link hover:underline">
        {t('meetings.backToMeetings')}
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <MeetingStatusBadge status={status} t={t} />
            <span className="text-sm font-medium text-ink-700">{formatDateTime(meeting.startAt, locale)}</span>
          </div>

          <h1 className="text-2xl font-semibold text-ink-900">{title.value}</h1>
          <p className="text-sm text-ink-500">{t('meetings.hostedBy', { name: meeting.hostName })}</p>
          <p className="text-[15px] leading-relaxed text-ink-700">{description.value}</p>

          <div>
            <JoinMeetingButton meeting={meeting} t={t} />
          </div>
        </CardContent>
      </Card>

      {otherUpcoming.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('meetings.upcomingTitle')}</h2>
          <div className="flex flex-col gap-2">
            {otherUpcoming.map((m) => (
              <Link
                key={m.slug}
                href={`/community/meetings/${m.slug}`}
                className="rounded-xl border border-sand-200 px-4 py-3 text-sm font-medium text-ink-900 hover:bg-sand-50"
              >
                {localize(m.title, locale).value}
                <span className="ml-2 text-xs font-normal text-ink-500">{formatDateTime(m.startAt, locale)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
