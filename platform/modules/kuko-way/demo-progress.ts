// Static demo data for the Day 2 Home/Program "continue" experience.
// Practice completion isn't tracked by any backend yet (explicitly out of
// Day 2 scope) — these are illustrative numbers, not a real user's history,
// shaped the way real progress data will eventually look so the UI won't
// need to change when that backend lands.
export interface DemoProgress {
  activeProgramSlug: '7-days' | '14-days' | '28-days';
  currentDay: number;
  practicesCompleted: number;
  streakDays: number;
}

export const demoProgress: DemoProgress = {
  activeProgramSlug: '7-days',
  currentDay: 3,
  practicesCompleted: 5,
  streakDays: 3,
};
