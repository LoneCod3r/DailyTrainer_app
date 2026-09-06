// Static demo default for the Day 2 Home/Program "continue" experience.
// There's no enrollment flow yet (explicitly out of Day 2 scope), so which
// program counts as "active" is a fixed default, not a real user's choice —
// shaped the way real enrollment data will eventually look so the UI won't
// need to change when that backend lands. Everything about your progress
// *within* that program (day X of N, streak, completed count) is NOT demo
// data — see lib/local-progress.ts, which reads this device's real
// completion history from localStorage.
export interface DemoProgress {
  activeProgramSlug: '7-days' | '14-days' | '28-days';
}

export const demoProgress: DemoProgress = {
  activeProgramSlug: '7-days',
};
