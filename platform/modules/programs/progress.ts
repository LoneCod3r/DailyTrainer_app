import { getProgramDays } from './service';
import type { DayState, ProgramDay, ResetProgram } from './types';

// Pure progression rules (V1 decision document §2), shared by the pages and
// the progress API so what the UI shows and what the server enforces can't
// disagree:
//   • a day is complete when all of its required items are done;
//   • day 1 is open; day N opens once day N−1 is complete (no calendar
//     gating); completed days stay open to revisit;
//   • intro items ("before you begin") are always open and never gate.

export function isDayComplete(day: ProgramDay, completedItemIds: ReadonlySet<string>): boolean {
  const required = day.items.filter((item) => item.required);
  if (required.length === 0) return day.items.every((item) => completedItemIds.has(item.id));
  return required.every((item) => completedItemIds.has(item.id));
}

export function getDayStates(program: ResetProgram, completedItemIds: ReadonlySet<string>): Map<number, DayState> {
  const states = new Map<number, DayState>();
  let previousComplete = true;
  for (const day of getProgramDays(program)) {
    const complete = isDayComplete(day, completedItemIds);
    states.set(day.day, complete && previousComplete ? 'completed' : previousComplete ? 'available' : 'locked');
    previousComplete = previousComplete && complete;
  }
  return states;
}

export function isDayOpen(program: ResetProgram, day: number, completedItemIds: ReadonlySet<string>): boolean {
  if (day === 0) return true;
  const state = getDayStates(program, completedItemIds).get(day);
  return state === 'available' || state === 'completed';
}

// The day to continue with: the first day not yet complete, or the last day
// once everything is done.
export function getCurrentDay(program: ResetProgram, completedItemIds: ReadonlySet<string>): number {
  const days = getProgramDays(program);
  const states = getDayStates(program, completedItemIds);
  const next = days.find((d) => states.get(d.day) !== 'completed');
  return next ? next.day : days[days.length - 1]?.day ?? 1;
}

export function countCompletedDays(program: ResetProgram, completedItemIds: ReadonlySet<string>): number {
  let count = 0;
  for (const state of getDayStates(program, completedItemIds).values()) if (state === 'completed') count++;
  return count;
}

export function isProgramComplete(program: ResetProgram, completedItemIds: ReadonlySet<string>): boolean {
  return countCompletedDays(program, completedItemIds) === getProgramDays(program).length;
}
