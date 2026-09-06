import { meetings } from './content/meetings';
import type { Meeting, MeetingStatus } from './types';

const STARTING_SOON_WINDOW_MS = 15 * 60 * 1000;

// Status is derived from timestamps rather than stored, so it never needs a
// background job to stay correct — only `cancelled` is stored state.
export function getMeetingStatus(meeting: Meeting, now: Date = new Date()): MeetingStatus {
  if (meeting.cancelled) return 'cancelled';
  const start = new Date(meeting.startAt).getTime();
  const end = new Date(meeting.endAt).getTime();
  const t = now.getTime();

  if (t >= start && t <= end) return 'live';
  if (t > end) return 'ended';
  if (start - t <= STARTING_SOON_WINDOW_MS) return 'starting-soon';
  return 'upcoming';
}

export type JoinState = 'available' | 'not-yet' | 'unavailable' | 'ended' | 'cancelled';

// The Join button's own state — independent of MeetingStatus display so a
// "starting soon" meeting without a real link yet still shows correctly.
export function getJoinState(meeting: Meeting, now: Date = new Date()): JoinState {
  const status = getMeetingStatus(meeting, now);
  if (status === 'cancelled') return 'cancelled';
  if (status === 'ended') return 'ended';
  if (!meeting.joinUrl) return 'unavailable';
  if (status === 'live' || status === 'starting-soon') return 'available';
  return 'not-yet';
}

export function getAllMeetings(): Meeting[] {
  return [...meetings].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

export function getUpcomingMeetings(now: Date = new Date()): Meeting[] {
  return getAllMeetings().filter((m) => {
    const status = getMeetingStatus(m, now);
    // A cancelled meeting whose original time hasn't passed yet still shows
    // here (with a "Cancelled" badge) rather than silently disappearing —
    // members who saw it scheduled should see that it was cancelled.
    if (status === 'cancelled') return new Date(m.endAt).getTime() >= now.getTime();
    return status === 'upcoming' || status === 'starting-soon' || status === 'live';
  });
}

export function getPastMeetings(now: Date = new Date()): Meeting[] {
  return getAllMeetings()
    .filter((m) => getMeetingStatus(m, now) === 'ended')
    .reverse();
}

export function getMeetingBySlug(slug: string): Meeting | undefined {
  return meetings.find((m) => m.slug === slug);
}

export function getNextUpcomingMeeting(now: Date = new Date()): Meeting | undefined {
  return getUpcomingMeetings(now)[0];
}
