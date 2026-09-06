import { Button } from '@/components/ui';
import { getJoinState } from '@/modules/events/service';
import type { Meeting } from '@/modules/events/types';
import type { DictKey } from '@/lib/i18n/dictionaries';

const STATE_LABEL: Record<ReturnType<typeof getJoinState>, DictKey> = {
  available: 'meetings.join',
  'not-yet': 'meetings.joinNotYet',
  unavailable: 'meetings.joinComingSoon',
  ended: 'meetings.joinEnded',
  cancelled: 'meetings.joinCancelled',
};

// Never links to an invented URL — `joinUrl` is absent on all demo data
// today, so this always renders the "coming soon" disabled state until a
// real meeting link exists (see modules/events/types.ts).
export function JoinMeetingButton({ meeting, t, size = 'md' }: { meeting: Meeting; t: (key: DictKey) => string; size?: 'sm' | 'md' }) {
  const state = getJoinState(meeting);

  if (state === 'available' && meeting.joinUrl) {
    return (
      <a href={meeting.joinUrl} target="_blank" rel="noopener noreferrer">
        <Button size={size}>{t(STATE_LABEL[state])}</Button>
      </a>
    );
  }

  return (
    <Button size={size} variant="secondary" disabled>
      {t(STATE_LABEL[state])}
    </Button>
  );
}
