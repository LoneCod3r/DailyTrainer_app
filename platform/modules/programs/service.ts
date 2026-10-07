import { features } from '@/lib/features';
import { oneDayReset } from './content/one-day';
import { threeDayReset } from './content/three-days';
import { sevenDayReset } from './content/seven-days';
import { twentyEightDayReset } from './content/twenty-eight-days';
import type { ProgramDay, ProgramItem, ResetProgram } from './types';

// Static content accessors for the Reset Programs. Whether a *user* may open
// a program is a separate question — see modules/commerce/entitlements.service.ts.

const ALL_PROGRAMS: ResetProgram[] = [oneDayReset, threeDayReset, sevenDayReset, twentyEightDayReset];

export function getAllProgramsUnfiltered(): ResetProgram[] {
  return [...ALL_PROGRAMS].sort((a, b) => a.order - b.order);
}

// Published programs, plus unpublished ones while preview is on
// (lib/features.ts: on outside production, opt-in in production).
export function getVisiblePrograms(): ResetProgram[] {
  return getAllProgramsUnfiltered().filter((p) => p.published || features.programsPreview);
}

export function getVisibleProgram(slug: string): ResetProgram | undefined {
  return getVisiblePrograms().find((p) => p.slug === slug);
}

export function getProgramDays(program: ResetProgram): ProgramDay[] {
  return program.phases.flatMap((phase) => phase.days).sort((a, b) => a.day - b.day);
}

export function getProgramDay(program: ResetProgram, day: number): ProgramDay | undefined {
  return getProgramDays(program).find((d) => d.day === day);
}

export function getPhaseForDay(program: ResetProgram, day: number) {
  return program.phases.find((phase) => phase.days.some((d) => d.day === day));
}

// Where an item lives: an intro item (day 0, always open) or a program day.
export function findProgramItem(program: ResetProgram, itemId: string): { item: ProgramItem; day: number } | undefined {
  const intro = program.introItems.find((i) => i.id === itemId);
  if (intro) return { item: intro, day: 0 };
  for (const day of getProgramDays(program)) {
    const item = day.items.find((i) => i.id === itemId);
    if (item) return { item, day: day.day };
  }
  return undefined;
}

export function isProgramContentComplete(program: ResetProgram): boolean {
  const items = [...program.introItems, ...getProgramDays(program).flatMap((d) => d.items)];
  return program.documents.every((d) => d.body) && items.every((i) => !i.contentRequired);
}
