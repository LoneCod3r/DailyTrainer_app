import Link from 'next/link';
import { Card, CardContent } from '@/components/ui';
import { MeetingStatusBadge } from './MeetingStatusBadge';
import { JoinMeetingButton } from './JoinMeetingButton';
import { getMeetingStatus } from '@/modules/events/service';
import { formatDateTime } from '@/lib/format-date';
import { localize } from '@/modules/kuko-way/types';
import type { Locale } from '@/lib/i18n/locale';
import type { Meeting } from '@/modules/events/types';
import type { DictKey } from '@/lib/i18n/dictionaries';

export function MeetingCard({
  meeting,
  locale,
  t,
  emphasize = true,
}: {
  meeting: Meeting;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  emphasize?: boolean;
}) {
  const title = localize(meeting.title, locale);
  const description = localize(meeting.description, locale);
  const status = getMeetingStatus(meeting);

  return (
    <Card className={emphasize ? undefined : 'opacity-90'}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <MeetingStatusBadge status={status} t={t} />
          <span className="text-sm font-medium text-ink-700">{formatDateTime(meeting.startAt, locale)}</span>
        </div>

        <Link href={`/community/meetings/${meeting.slug}`}>
          <h3 className="text-base font-semibold text-ink-900 hover:underline">{title.value}</h3>
        </Link>
        <p className="line-clamp-2 text-sm text-ink-500">{description.value}</p>
        <p className="text-xs text-ink-300">{t('meetings.hostedBy', { name: meeting.hostName })}</p>

        {emphasize && (
          <div className="pt-1">
            <JoinMeetingButton meeting={meeting} t={t} size="sm" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
