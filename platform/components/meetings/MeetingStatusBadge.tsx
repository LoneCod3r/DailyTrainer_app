import { Badge } from '@/components/ui';
import type { MeetingStatus } from '@/modules/events/types';
import type { DictKey } from '@/lib/i18n/dictionaries';

const STATUS_KEY: Record<MeetingStatus, DictKey> = {
  live: 'meetings.statusLive',
  'starting-soon': 'meetings.statusStartingSoon',
  upcoming: 'meetings.statusUpcoming',
  ended: 'meetings.statusEnded',
  cancelled: 'meetings.statusCancelled',
};

const STATUS_TONE: Record<MeetingStatus, 'brand' | 'warning' | 'neutral' | 'danger'> = {
  live: 'brand',
  'starting-soon': 'warning',
  upcoming: 'neutral',
  ended: 'neutral',
  cancelled: 'danger',
};

// Status is always paired with its text label (never color alone) so it
// reads correctly for screen readers and colorblind users.
export function MeetingStatusBadge({ status, t }: { status: MeetingStatus; t: (key: DictKey) => string }) {
  return <Badge tone={STATUS_TONE[status]}>{t(STATUS_KEY[status])}</Badge>;
}
