import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Prisma } from '@prisma/client';
import { computeStreak, isLocalDateString, isPlausibleToday, shiftLocalDate } from '@/lib/progress/dates';
import { importDeviceCompletionsSchema, recordPracticeSessionSchema } from '@/lib/validations/practice';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    practiceSession: {
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    favoritePractice: { upsert: vi.fn(), deleteMany: vi.fn() },
  },
}));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

const { prisma } = await import('@/lib/prisma');
const { getServerSession } = await import('next-auth');
const service = await import('@/modules/kuko-way/progress.service');
const sessionsRoute = await import('@/app/api/practice-sessions/route');
const summaryRoute = await import('@/app/api/practice-sessions/summary/route');
const favoritesRoute = await import('@/app/api/favorites/[practiceSlug]/route');

const TODAY = new Date().toISOString().slice(0, 10);

describe('calendar-day helpers', () => {
  it('validates real calendar dates only', () => {
    expect(isLocalDateString('2026-10-07')).toBe(true);
    expect(isLocalDateString('2026-02-30')).toBe(false);
    expect(isLocalDateString('2026-1-7')).toBe(false);
  });

  it('shifts across month and year boundaries', () => {
    expect(shiftLocalDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftLocalDate('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('only accepts a "today" within real timezone offsets of the server clock', () => {
    const now = new Date('2026-10-07T23:30:00Z');
    expect(isPlausibleToday('2026-10-08', now)).toBe(true); // UTC+3 just after midnight
    expect(isPlausibleToday('2026-10-06', now)).toBe(true);
    expect(isPlausibleToday('2026-10-10', now)).toBe(false);
    expect(isPlausibleToday('not-a-date', now)).toBe(false);
  });
});

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-10-05', '2026-10-06', '2026-10-07'], '2026-10-07')).toBe(3);
  });

  it('keeps yesterday’s streak alive before today’s practice', () => {
    expect(computeStreak(['2026-10-05', '2026-10-06'], '2026-10-07')).toBe(2);
  });

  it('breaks on a missed day and ignores older history', () => {
    expect(computeStreak(['2026-10-01', '2026-10-02', '2026-10-07'], '2026-10-07')).toBe(1);
    expect(computeStreak(['2026-10-01'], '2026-10-07')).toBe(0);
  });

  it('follows local calendar days, so a 00:30 practice counts for that day', () => {
    // Sessions keep the device's own day — 2026-10-07 00:30 in Sofia is
    // 2026-10-06T21:30Z, but is stored as "2026-10-07".
    expect(computeStreak(['2026-10-06', '2026-10-07'], '2026-10-07')).toBe(2);
  });
});

describe('recordPracticeSessionSchema', () => {
  const base = { clientId: 'abcdef123456', practiceSlug: 'body-scan-1', localDate: TODAY };

  it('accepts a minimal session and normalises optional fields', () => {
    const parsed = recordPracticeSessionSchema.parse({ ...base, preFeelings: ['tension', 'tension'], note: '   ' });
    expect(parsed.preFeelings).toEqual(['tension']);
    expect(parsed.note).toBeUndefined();
  });

  it('rejects unknown feelings, oversized notes and malformed ids', () => {
    expect(() => recordPracticeSessionSchema.parse({ ...base, postFeeling: 'amazing' })).toThrow();
    expect(() => recordPracticeSessionSchema.parse({ ...base, note: 'x'.repeat(1001) })).toThrow();
    expect(() => recordPracticeSessionSchema.parse({ ...base, clientId: 'bad id!' })).toThrow();
    expect(() => recordPracticeSessionSchema.parse({ ...base, durationSec: -1 })).toThrow();
  });

  it('rejects a forged or far-off "today"', () => {
    expect(() => recordPracticeSessionSchema.parse({ ...base, localDate: '2020-01-01' })).toThrow();
  });

  it('bounds the device import size', () => {
    const completions = Array.from({ length: 201 }, () => ({ practiceSlug: 'body-scan-1', localDate: '2026-10-01' }));
    expect(() => importDeviceCompletionsSchema.parse({ completions, today: TODAY })).toThrow();
  });
});

describe('progress.service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is idempotent on clientId — a retried save returns the existing row', async () => {
    (prisma.practiceSession.findUnique as any).mockResolvedValue({ id: 'existing' });
    const result = await service.recordPracticeSession('u1', { clientId: 'abcdef123456', practiceSlug: 'x', localDate: TODAY });
    expect(result).toEqual({ session: { id: 'existing' }, created: false });
    expect(prisma.practiceSession.create).not.toHaveBeenCalled();
  });

  it('returns the winner when a concurrent identical save hits the unique constraint', async () => {
    (prisma.practiceSession.findUnique as any).mockResolvedValue(null);
    (prisma.practiceSession.create as any).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', { code: 'P2002', clientVersion: 'test' }),
    );
    (prisma.practiceSession.findUniqueOrThrow as any).mockResolvedValue({ id: 'winner' });
    const result = await service.recordPracticeSession('u1', { clientId: 'abcdef123456', practiceSlug: 'x', localDate: TODAY });
    expect(result.created).toBe(false);
    expect(result.session).toEqual({ id: 'winner' });
  });

  it('imports device completions with deterministic ids, skipping duplicates and future days', async () => {
    (prisma.practiceSession.createMany as any).mockResolvedValue({ count: 1 });
    await service.importDeviceCompletions(
      'u1',
      [
        { practiceSlug: 'body-scan-1', localDate: '2026-10-01' },
        { practiceSlug: 'body-scan-1', localDate: '2999-01-01' },
      ],
      '2026-10-07',
    );
    const call = (prisma.practiceSession.createMany as any).mock.calls[0][0];
    expect(call.skipDuplicates).toBe(true);
    expect(call.data).toHaveLength(1);
    expect(call.data[0]).toMatchObject({ userId: 'u1', source: 'DEVICE_IMPORT', clientId: 'dev_20261001_body-scan-1' });
  });

  it('summarises measured minutes, distinct days and the streak', async () => {
    (prisma.practiceSession.aggregate as any).mockResolvedValue({ _count: { _all: 4 }, _sum: { durationSec: 1530 } });
    (prisma.practiceSession.findMany as any)
      .mockResolvedValueOnce([{ localDate: '2026-10-06' }, { localDate: '2026-10-07' }])
      .mockResolvedValueOnce([{ practiceSlug: 'a' }, { practiceSlug: 'b' }, { practiceSlug: 'c' }]);
    const summary = await service.getPracticeSummary('u1', '2026-10-07');
    expect(summary).toEqual({ sessionsCompleted: 4, practicesExplored: 3, totalMinutes: 26, streakDays: 2, practicedDays: 2 });
    // Every query is scoped to the requesting user.
    expect((prisma.practiceSession.aggregate as any).mock.calls[0][0].where).toEqual({ userId: 'u1' });
  });
});

describe('practice API routes', () => {
  beforeEach(() => vi.clearAllMocks());

  const post = (body: unknown) =>
    sessionsRoute.POST(new Request('http://x/api/practice-sessions', { method: 'POST', body: JSON.stringify(body) }));

  it('requires a signed-in user', async () => {
    (getServerSession as any).mockResolvedValue(null);
    expect((await post({})).status).toBe(401);
    const summary = await summaryRoute.GET(new Request(`http://x/api/practice-sessions/summary?today=${TODAY}`));
    expect(summary.status).toBe(401);
    const fav = await favoritesRoute.PUT(new Request('http://x', { method: 'PUT' }), { params: { practiceSlug: 'body-scan-1' } });
    expect(fav.status).toBe(401);
  });

  it('rejects practices that do not exist or cannot be done on their own', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'u-route-1', role: 'USER' } });
    expect((await post({ clientId: 'abcdef123456', practiceSlug: 'no-such-practice', localDate: TODAY })).status).toBe(404);
    // "organ-reset" is a collection of sub-practices, not a practice itself.
    expect((await post({ clientId: 'abcdef123457', practiceSlug: 'organ-reset', localDate: TODAY })).status).toBe(404);
  });

  it('records against the session user, never a user id from the body', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'u-route-2', role: 'USER' } });
    (prisma.practiceSession.findUnique as any).mockResolvedValue(null);
    (prisma.practiceSession.create as any).mockResolvedValue({ id: 's1' });
    const res = await post({ clientId: 'abcdef123458', practiceSlug: 'body-scan-1', localDate: TODAY, userId: 'someone-else' });
    expect(res.status).toBe(201);
    expect((prisma.practiceSession.create as any).mock.calls[0][0].data.userId).toBe('u-route-2');
  });
});
