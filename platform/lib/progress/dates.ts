// Calendar-day helpers shared by the server progress service and the
// on-device fallback (lib/local-progress.ts). Pure functions, no I/O.
//
// A "local date" is a YYYY-MM-DD string for the user's own calendar day. It
// is always derived on the user's device (where the timezone is known) and
// stored as-is — never re-derived from a UTC timestamp — so a practice just
// after midnight in Sofia counts for the day it actually happened on.

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isLocalDateString(value: string): boolean {
  if (!LOCAL_DATE_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

// The device's own calendar day for `date` (defaults to now).
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Calendar arithmetic on a YYYY-MM-DD string (timezone-free).
export function shiftLocalDate(value: string, days: number): string {
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

// Accepts a client-supplied "today" only if it's a real calendar date within
// the range of timezones that exist relative to the server's clock (UTC−12 …
// UTC+14). Anything else is a malformed or forged value.
export function isPlausibleToday(value: string, now: Date = new Date()): boolean {
  if (!isLocalDateString(value)) return false;
  const utcToday = now.toISOString().slice(0, 10);
  return value >= shiftLocalDate(utcToday, -1) && value <= shiftLocalDate(utcToday, 1);
}

// Consecutive practice days ending today — or ending yesterday if nothing
// has been done yet today, so the streak doesn't look broken before the user
// has had a chance to practise.
export function computeStreak(practicedDates: Iterable<string>, today: string): number {
  const days = new Set(practicedDates);
  let cursor = days.has(today) ? today : shiftLocalDate(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = shiftLocalDate(cursor, -1);
  }
  return streak;
}
