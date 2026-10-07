'use client';

// Hybrid practice-progress facade — the one client API the UI uses, so no
// component reads localStorage or calls the progress endpoints directly:
//   • signed in  → the server (app/api/practice-sessions, account-wide)
//   • signed out → this device only (lib/local-progress.ts)
// On sign-in, the device record is merged into the account once
// (useDeviceProgressImport), idempotently.
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { toLocalDateString } from './dates';
import {
  getImportedCount,
  getLocalCompletions,
  getLocalProgressSummary,
  setImportedCount,
  setPracticeCompleted,
} from '@/lib/local-progress';
import type { PostFeeling, PreFeeling } from '@/modules/kuko-way/check-ins';

export function newClientId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID().replace(/-/g, '');
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

export interface RecordPracticeInput {
  clientId: string;
  practiceSlug: string;
  durationSec?: number;
  preFeelings?: PreFeeling[];
  postFeeling?: PostFeeling;
  note?: string;
}

export class ProgressSaveError extends Error {}

// Signed in: persists the session + check-ins to the account (safe to retry
// with the same clientId). Signed out: records only the completion on this
// device — check-ins and notes are never stored on the device.
export async function recordPractice(signedIn: boolean, input: RecordPracticeInput): Promise<void> {
  if (!signedIn) {
    setPracticeCompleted(input.practiceSlug, true);
    return;
  }
  const res = await fetch('/api/practice-sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, localDate: toLocalDateString() }),
  });
  if (!res.ok) throw new ProgressSaveError(`save failed: ${res.status}`);
}

export interface ProgressSummaryView {
  source: 'account' | 'device';
  sessionsCompleted: number;
  totalMinutes: number | null; // only measured on the account
  streakDays: number;
  practicedDays: number;
}

const EMPTY: ProgressSummaryView = { source: 'device', sessionsCompleted: 0, totalMinutes: null, streakDays: 0, practicedDays: 0 };

// Reads as zeros until loaded, so it never flashes a stale or invented value.
export function useProgressSummary(): { ready: boolean; summary: ProgressSummaryView } {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [state, setState] = useState<{ ready: boolean; summary: ProgressSummaryView }>({ ready: false, summary: EMPTY });

  useEffect(() => {
    if (status === 'loading') return;
    if (!userId) {
      const local = getLocalProgressSummary();
      setState({
        ready: true,
        summary: {
          source: 'device',
          sessionsCompleted: local.practicesCompleted,
          totalMinutes: null,
          streakDays: local.streakDays,
          practicedDays: local.practicedDays,
        },
      });
      return;
    }
    let cancelled = false;
    fetch(`/api/practice-sessions/summary?today=${toLocalDateString()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        if (cancelled) return;
        setState({
          ready: true,
          summary: {
            source: 'account',
            sessionsCompleted: data.sessionsCompleted,
            totalMinutes: data.totalMinutes,
            streakDays: data.streakDays,
            practicedDays: data.practicedDays,
          },
        });
      })
      .catch(() => {
        if (!cancelled) setState({ ready: true, summary: { ...EMPTY, source: 'account' } });
      });
    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  return state;
}

// Merges this device's signed-out completions into the account after sign
// in. Runs at most once per (device, user, new completions); the endpoint is
// idempotent, so a repeat (another tab, a retry) is harmless.
export function useDeviceProgressImport(): void {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return;
    const completions = getLocalCompletions();
    if (completions.length === 0 || completions.length <= getImportedCount(userId)) return;
    fetch('/api/practice-sessions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completions: completions.slice(0, 200), today: toLocalDateString() }),
    })
      .then((res) => {
        if (res.ok) setImportedCount(userId, completions.length);
      })
      .catch(() => {
        // Try again on a later visit.
      });
  }, [userId]);
}
