// On-device practice-completion record for signed-out visitors, backed by
// localStorage. Signed-in users' practice history lives on the server
// (modules/kuko-way/progress.service.ts); this device record is imported
// into their account once, on sign-in (see lib/progress/client.ts). Never
// invents numbers: if nothing is stored, everything reads as zero.
// Client-only — every call must happen after mount.
//
// Deliberately stores only "practice X was done on day Y" — no check-ins or
// notes, which are account-only (private, not left behind on a device).
import { computeStreak, isLocalDateString, toLocalDateString } from '@/lib/progress/dates';

const PREFIX = 'ptd:completed:';
const IMPORTED_PREFIX = 'ptd:imported:';

export function isPracticeCompleted(slug: string): boolean {
  try {
    return localStorage.getItem(PREFIX + slug) !== null;
  } catch {
    return false;
  }
}

// Stores the device's own calendar day (not a UTC date) so streaks follow
// the user's local midnight. Older entries written as UTC dates are still
// read as-is.
export function setPracticeCompleted(slug: string, completed: boolean): void {
  try {
    if (completed) localStorage.setItem(PREFIX + slug, toLocalDateString());
    else localStorage.removeItem(PREFIX + slug);
  } catch {
    // localStorage unavailable — state just won't persist.
  }
}

export interface LocalCompletion {
  practiceSlug: string;
  localDate: string;
}

export function getLocalCompletions(): LocalCompletion[] {
  const out: LocalCompletion[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      const value = localStorage.getItem(key);
      if (value && isLocalDateString(value)) out.push({ practiceSlug: key.slice(PREFIX.length), localDate: value });
    }
  } catch {
    return [];
  }
  return out;
}

export interface LocalProgressSummary {
  practicesCompleted: number;
  streakDays: number;
  practicedDays: number;
}

// practicesCompleted counts distinct practices completed on this device.
// streakDays counts consecutive calendar days ending today (or yesterday —
// see computeStreak). practicedDays is the number of distinct days with a
// completion.
export function getLocalProgressSummary(): LocalProgressSummary {
  const completions = getLocalCompletions();
  const dates = new Set(completions.map((c) => c.localDate));
  return {
    practicesCompleted: completions.length,
    streakDays: computeStreak(dates, toLocalDateString()),
    practicedDays: dates.size,
  };
}

// Whether this device's record has already been merged into `userId`'s
// account, and how many completions it held at the time — so new signed-out
// completions made later on the same device are imported too.
export function getImportedCount(userId: string): number {
  try {
    return Number(localStorage.getItem(IMPORTED_PREFIX + userId) ?? '0') || 0;
  } catch {
    return 0;
  }
}

export function setImportedCount(userId: string, count: number): void {
  try {
    localStorage.setItem(IMPORTED_PREFIX + userId, String(count));
  } catch {
    // ignore — worst case the (idempotent) import runs again next time.
  }
}
