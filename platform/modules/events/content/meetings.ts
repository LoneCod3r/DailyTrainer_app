// Demo/seed meeting data. Dates are generated relative to "now" (not
// hardcoded) so upcoming/past stays realistic no matter when this is run —
// see modules/events/types.ts for why nothing here is a real scheduled
// event. Host names are role labels, not real people.
import type { Meeting } from '../types';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function inDays(days: number): Date {
  return new Date(Date.now() + days * DAY);
}

export const meetings: Meeting[] = [
  {
    slug: 'community-open-qa',
    title: { bg: 'Отворени въпроси с общността', en: 'Community Open Q&A' },
    description: {
      bg: 'Отворена сесия за въпроси и отговори с екипа на KUKO WAY — сподели опита си и питай каквото те вълнува.',
      en: 'An open question-and-answer session with the KUKO WAY team — share your experience and ask what is on your mind.',
    },
    hostName: 'KUKO WAY Team',
    startAt: inDays(5).toISOString(),
    endAt: new Date(inDays(5).getTime() + HOUR).toISOString(),
  },
  {
    slug: 'practice-together-morning-reset',
    title: { bg: 'Практика заедно: сутрешен рестарт', en: 'Practice Together: Morning Reset' },
    description: {
      bg: 'Групова сесия, в която преминаваме заедно през кратка сутрешна практика от Библиотеката.',
      en: 'A group session walking through a short morning practice from the Library together.',
    },
    hostName: 'KUKO WAY Team',
    startAt: inDays(12).toISOString(),
    endAt: new Date(inDays(12).getTime() + 45 * 60 * 1000).toISOString(),
  },
  {
    slug: 'members-open-forum',
    title: { bg: 'Открит форум за членове', en: 'Members Open Forum' },
    description: {
      bg: 'Свободен разговор за членове на общността — тази среща беше отменена.',
      en: 'A free-form conversation for community members — this session was cancelled.',
    },
    hostName: 'KUKO WAY Team',
    startAt: inDays(8).toISOString(),
    endAt: new Date(inDays(8).getTime() + HOUR).toISOString(),
    cancelled: true,
  },
  {
    slug: 'welcome-session',
    title: { bg: 'Уебинар за добре дошли', en: 'Welcome Session' },
    description: {
      bg: 'Въвеждаща среща за нови членове на общността на Personal Daily Trainer.',
      en: 'An introductory session for new members of the Personal Daily Trainer community.',
    },
    hostName: 'KUKO WAY Team',
    startAt: inDays(-14).toISOString(),
    endAt: new Date(inDays(-14).getTime() + HOUR).toISOString(),
  },
  {
    slug: 'first-community-checkin',
    title: { bg: 'Първа обратна връзка с общността', en: 'First Community Check-In' },
    description: {
      bg: 'Първата от поредица редовни срещи за обратна връзка с общността.',
      en: 'The first in a series of regular community feedback check-ins.',
    },
    hostName: 'KUKO WAY Team',
    startAt: inDays(-30).toISOString(),
    endAt: new Date(inDays(-30).getTime() + HOUR).toISOString(),
  },
];
