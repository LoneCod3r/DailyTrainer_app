import { prisma } from '@/lib/prisma';
import { findProgramItem, getProgramDays, getVisibleProgram } from './service';
import { countCompletedDays, getCurrentDay, isDayOpen, isProgramComplete } from './progress';
import type { ResetProgram } from './types';

// Persisted Reset Program progress: completed items, the day reflections and
// the enrollment row. Access is NOT checked here — callers (pages, API
// routes) must call hasProgramAccess() first; this module only enforces the
// progression rules (modules/programs/progress.ts) and keeps every query
// scoped to one user. Reflections are private to that user.

export async function getCompletedItemIds(userId: string, programSlug: string): Promise<Set<string>> {
  const rows = await prisma.programItemCompletion.findMany({
    where: { userId, programSlug },
    select: { itemId: true },
  });
  return new Set(rows.map((r) => r.itemId));
}

export async function getDayReflection(userId: string, programSlug: string, day: number) {
  return prisma.programDayReflection.findUnique({
    where: { userId_programSlug_day: { userId, programSlug, day } },
  });
}

export class ProgramProgressError extends Error {
  constructor(public code: 'ITEM_NOT_FOUND' | 'DAY_LOCKED' | 'DAY_NOT_FOUND') {
    super(code);
  }
}

async function ensureEnrollment(userId: string, programSlug: string) {
  await prisma.programEnrollment.upsert({
    where: { userId_programSlug: { userId, programSlug } },
    update: {},
    create: { userId, programSlug },
  });
}

// Marks one item done. Rejects items on a day that isn't open yet, so the
// sequence can't be skipped by calling the API directly. Idempotent.
export async function completeProgramItem(userId: string, program: ResetProgram, itemId: string) {
  const found = findProgramItem(program, itemId);
  if (!found) throw new ProgramProgressError('ITEM_NOT_FOUND');

  const completed = await getCompletedItemIds(userId, program.slug);
  if (!isDayOpen(program, found.day, completed)) throw new ProgramProgressError('DAY_LOCKED');

  await ensureEnrollment(userId, program.slug);
  await prisma.programItemCompletion.upsert({
    where: { userId_programSlug_itemId: { userId, programSlug: program.slug, itemId } },
    update: {},
    create: { userId, programSlug: program.slug, itemId },
  });

  completed.add(itemId);
  const programComplete = isProgramComplete(program, completed);
  if (programComplete) {
    await prisma.programEnrollment.updateMany({
      where: { userId, programSlug: program.slug, completedAt: null },
      data: { completedAt: new Date() },
    });
  }
  return { completedItemIds: completed, programComplete };
}

export async function saveDayReflection(
  userId: string,
  program: ResetProgram,
  day: number,
  input: { feeling?: string; note?: string },
) {
  if (!getProgramDays(program).some((d) => d.day === day)) throw new ProgramProgressError('DAY_NOT_FOUND');
  const completed = await getCompletedItemIds(userId, program.slug);
  if (!isDayOpen(program, day, completed)) throw new ProgramProgressError('DAY_LOCKED');

  await ensureEnrollment(userId, program.slug);
  return prisma.programDayReflection.upsert({
    where: { userId_programSlug_day: { userId, programSlug: program.slug, day } },
    update: { feeling: input.feeling ?? null, note: input.note ?? null },
    create: { userId, programSlug: program.slug, day, feeling: input.feeling, note: input.note },
  });
}

// Journey/Profile: every program this user has started, with its completed
// item ids (the caller turns those into day counts via progress.ts).
export async function listEnrollments(userId: string) {
  const [enrollments, completions] = await Promise.all([
    prisma.programEnrollment.findMany({ where: { userId }, orderBy: { startedAt: 'desc' } }),
    prisma.programItemCompletion.findMany({ where: { userId }, select: { programSlug: true, itemId: true } }),
  ]);
  return enrollments.map((enrollment) => ({
    enrollment,
    completedItemIds: new Set(completions.filter((c) => c.programSlug === enrollment.programSlug).map((c) => c.itemId)),
  }));
}

// Journey/Profile summary rows: one per started, still-visible program.
export async function getProgramProgressOverview(userId: string) {
  const rows = await listEnrollments(userId);
  return rows.flatMap(({ enrollment, completedItemIds }) => {
    const program = getVisibleProgram(enrollment.programSlug);
    if (!program) return [];
    return [
      {
        program,
        totalDays: getProgramDays(program).length,
        completedDays: countCompletedDays(program, completedItemIds),
        currentDay: getCurrentDay(program, completedItemIds),
        complete: Boolean(enrollment.completedAt),
      },
    ];
  });
}

export async function listRecentDayReflections(userId: string, limit = 10) {
  return prisma.programDayReflection.findMany({
    where: { userId, OR: [{ note: { not: null } }, { feeling: { not: null } }] },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  });
}
