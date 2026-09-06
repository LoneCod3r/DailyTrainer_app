// Member Meetings content model (Day 3). Static demo/seed data — no real
// meeting schedule, host, or join link has been provided yet, so nothing
// here should read as an actual scheduled event. Swapping this for a real
// backend later only means changing ./content/meetings.ts + service.ts;
// pages consume the same shape either way.
import type { LocalizedText } from '@/modules/kuko-way/types';

export interface Meeting {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  hostName: string;
  startAt: string; // ISO timestamp
  endAt: string; // ISO timestamp
  // Deliberately absent for all demo data — no real meeting link exists yet.
  // When present, the Join button becomes active during the live window.
  joinUrl?: string;
  cancelled?: boolean;
}

export type MeetingStatus = 'cancelled' | 'live' | 'starting-soon' | 'upcoming' | 'ended';
