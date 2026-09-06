// Static demo data for the Day 2 Home/Program "continue" experience.
// There's no per-user program/day tracking backend yet (explicitly out of
// Day 2 scope), so activeProgramSlug/currentDay are illustrative, not a real
// user's history — shaped the way real progress data will eventually look
// so the UI won't need to change when that backend lands. Practice
// completion itself is NOT demo data — see lib/local-progress.ts, which
// reads this device's real completion history from localStorage.
export interface DemoProgress {
  activeProgramSlug: '7-days' | '14-days' | '28-days';
  currentDay: number;
}

export const demoProgress: DemoProgress = {
  activeProgramSlug: '7-days',
  currentDay: 3,
};
