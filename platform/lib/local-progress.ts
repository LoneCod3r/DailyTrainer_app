// Real per-device practice-completion tracking, backed by localStorage —
// there is no practice-tracking backend yet (see modules/kuko-way/service.ts
// and MarkCompleteButton), so this is the only source of truth for "did I
// actually do this." Never invents numbers: if nothing is stored, everything
// reads as zero. Client-only — every call must happen after mount.
const PREFIX = 'ptd:completed:';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isPracticeCompleted(slug: string): boolean {
  try {
    return localStorage.getItem(PREFIX + slug) !== null;
  } catch {
    return false;
  }
}

// Stores today's date rather than a bare flag so a real day-streak can be
// computed later — see getLocalProgressSummary.
export function setPracticeCompleted(slug: string, completed: boolean): void {
  try {
    if (completed) localStorage.setItem(PREFIX + slug, dateKey(new Date()));
    else localStorage.removeItem(PREFIX + slug);
  } catch {
    // localStorage unavailable — state just won't persist.
  }
}

export interface LocalProgressSummary {
  practicesCompleted: number;
  streakDays: number;
}

// practicesCompleted counts practices currently marked complete on this
// device (unmarking one removes it, same as MarkCompleteButton's toggle).
// streakDays counts consecutive calendar days, ending today, that have at
// least one completion — walking backward from today, or from yesterday if
// nothing is completed yet today so the streak doesn't look broken before
// you've had a chance to practice.
export function getLocalProgressSummary(): LocalProgressSummary {
  const completionDates = new Set<string>();
  let practicesCompleted = 0;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(PREFIX)) continue;
      practicesCompleted++;
      const value = localStorage.getItem(key);
      if (value && DATE_RE.test(value)) completionDates.add(value);
    }
  } catch {
    return { practicesCompleted: 0, streakDays: 0 };
  }

  const cursor = new Date();
  if (!completionDates.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);

  let streakDays = 0;
  while (completionDates.has(dateKey(cursor))) {
    streakDays++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { practicesCompleted, streakDays };
}
