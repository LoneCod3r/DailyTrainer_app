import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { computeStreak } from '@/lib/progress/dates';
import type { PostFeeling, PreFeeling } from './check-ins';

// Persisted practice history for signed-in users — the server-side half of
// the hybrid progress model (signed-out visitors keep the on-device record in
// lib/local-progress.ts; it's imported here once they sign in). Practice
// content itself stays static (./content); rows reference it by slug, and
// callers validate the slug against that content before writing.
//
// Check-ins and notes are private: every read here is scoped to one userId,
// and nothing exposes them to anyone but that user.

export interface RecordPracticeSessionInput {
  clientId: string;
  practiceSlug: string;
  localDate: string;
  durationSec?: number;
  preFeelings?: PreFeeling[];
  postFeeling?: PostFeeling;
  note?: string;
}

// Idempotent on (userId, clientId): a retried or double-submitted save
// returns the row that already exists instead of creating a second one.
export async function recordPracticeSession(userId: string, input: RecordPracticeSessionInput) {
  const existing = await prisma.practiceSession.findUnique({
    where: { userId_clientId: { userId, clientId: input.clientId } },
  });
  if (existing) return { session: existing, created: false };

  try {
    const session = await prisma.practiceSession.create({
      data: {
        userId,
        clientId: input.clientId,
        practiceSlug: input.practiceSlug,
        localDate: input.localDate,
        durationSec: input.durationSec,
        preFeelings: input.preFeelings ?? [],
        postFeeling: input.postFeeling,
        note: input.note,
      },
    });
    return { session, created: true };
  } catch (err) {
    // Lost a race with a concurrent identical request — the unique
    // constraint held, so return the winner.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const session = await prisma.practiceSession.findUniqueOrThrow({
        where: { userId_clientId: { userId, clientId: input.clientId } },
      });
      return { session, created: false };
    }
    throw err;
  }
}

// One-time import of a device's pre-sign-in completions. The client id is
// derived from slug + day, so importing the same device twice (or two tabs
// racing) can never double-count — skipDuplicates relies on the same unique
// key as recordPracticeSession.
export async function importDeviceCompletions(
  userId: string,
  completions: { practiceSlug: string; localDate: string }[],
  today: string,
) {
  const rows = completions
    .filter((c) => c.localDate <= today)
    .map((c) => ({
      userId,
      clientId: deviceImportClientId(c.practiceSlug, c.localDate),
      practiceSlug: c.practiceSlug,
      localDate: c.localDate,
      source: 'DEVICE_IMPORT' as const,
    }));
  if (rows.length === 0) return { imported: 0 };
  const result = await prisma.practiceSession.createMany({ data: rows, skipDuplicates: true });
  return { imported: result.count };
}

export function deviceImportClientId(practiceSlug: string, localDate: string): string {
  // Within clientIdSchema's alphabet/length so it can't collide with, or be
  // rejected by, the same uniqueness rules as app-recorded sessions.
  return `dev_${localDate.replace(/-/g, '')}_${practiceSlug}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 64);
}

export interface PracticeSummary {
  sessionsCompleted: number;
  practicesExplored: number;
  totalMinutes: number;
  streakDays: number;
  practicedDays: number;
}

export async function getPracticeSummary(userId: string, today: string): Promise<PracticeSummary> {
  const [aggregate, days, distinctPractices] = await Promise.all([
    prisma.practiceSession.aggregate({ where: { userId }, _count: { _all: true }, _sum: { durationSec: true } }),
    prisma.practiceSession.findMany({ where: { userId }, select: { localDate: true }, distinct: ['localDate'] }),
    prisma.practiceSession.findMany({ where: { userId }, select: { practiceSlug: true }, distinct: ['practiceSlug'] }),
  ]);
  const dates = days.map((d) => d.localDate);
  return {
    sessionsCompleted: aggregate._count._all,
    practicesExplored: distinctPractices.length,
    // Measured time only (the practice timer) — never an estimate.
    totalMinutes: Math.round((aggregate._sum.durationSec ?? 0) / 60),
    streakDays: computeStreak(dates, today),
    practicedDays: dates.length,
  };
}

export async function listRecentPracticeSessions(userId: string, limit = 10) {
  return prisma.practiceSession.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    take: limit,
  });
}

export async function countSessionsForPractice(userId: string, practiceSlug: string) {
  return prisma.practiceSession.count({ where: { userId, practiceSlug } });
}

// ---------------------------------------------------------------------------
// Favorites
// ---------------------------------------------------------------------------

export async function listFavoritePracticeSlugs(userId: string): Promise<string[]> {
  const rows = await prisma.favoritePractice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { practiceSlug: true },
  });
  return rows.map((r) => r.practiceSlug);
}

export async function isFavoritePractice(userId: string, practiceSlug: string): Promise<boolean> {
  const row = await prisma.favoritePractice.findUnique({ where: { userId_practiceSlug: { userId, practiceSlug } } });
  return Boolean(row);
}

// Both idempotent — adding twice or removing something absent is a no-op.
export async function addFavoritePractice(userId: string, practiceSlug: string) {
  await prisma.favoritePractice.upsert({
    where: { userId_practiceSlug: { userId, practiceSlug } },
    update: {},
    create: { userId, practiceSlug },
  });
}

export async function removeFavoritePractice(userId: string, practiceSlug: string) {
  await prisma.favoritePractice.deleteMany({ where: { userId, practiceSlug } });
}
