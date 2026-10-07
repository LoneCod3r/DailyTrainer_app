import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    entitlement: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
    programItemCompletion: { findMany: vi.fn(), upsert: vi.fn() },
    programEnrollment: { upsert: vi.fn(), updateMany: vi.fn() },
    programDayReflection: { upsert: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));

const { prisma } = await import('@/lib/prisma');
const { getServerSession } = await import('next-auth');
const { getAllProgramsUnfiltered, getProgramDays, findProgramItem } = await import('@/modules/programs/service');
const progress = await import('@/modules/programs/progress');
const progressService = await import('@/modules/programs/progress.service');
const entitlements = await import('@/modules/commerce/entitlements.service');
const completeRoute = await import('@/app/api/programs/[slug]/items/[itemId]/complete/route');
const reflectionRoute = await import('@/app/api/programs/[slug]/days/[day]/reflection/route');
const adminRoute = await import('@/app/api/admin/entitlements/route');

const programs = getAllProgramsUnfiltered();
const program28 = programs.find((p) => p.slug === '28-days')!;
const program1 = programs.find((p) => p.slug === '1-day')!;

describe('program manifests', () => {
  it('has the 1 / 3 / 7 / 28 day Reset lineup', () => {
    expect(programs.map((p) => [p.slug, p.lengthDays])).toEqual([
      ['1-day', 1],
      ['3-days', 3],
      ['7-days', 7],
      ['28-days', 28],
    ]);
  });

  it.each(programs.map((p) => [p.slug, p] as const))('%s: days run 1..N exactly once, item ids are unique', (_slug, program) => {
    const days = getProgramDays(program).map((d) => d.day);
    expect(days).toEqual(Array.from({ length: program.lengthDays }, (_, i) => i + 1));
    const ids = [...program.introItems, ...getProgramDays(program).flatMap((d) => d.items)].map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Every day can actually be completed.
    for (const day of getProgramDays(program)) expect(day.items.some((i) => i.required)).toBe(true);
  });

  it('item ids are unique across all programs (progress rows key on them)', () => {
    const ids = programs.flatMap((p) => [...p.introItems, ...getProgramDays(p).flatMap((d) => d.items)].map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('invents nothing: placeholder items carry no media, duration or body', () => {
    for (const p of programs) {
      for (const item of [...p.introItems, ...getProgramDays(p).flatMap((d) => d.items)]) {
        if (!item.contentRequired) continue;
        expect(item.mediaAssetId).toBeUndefined();
        expect(item.durationSec).toBeUndefined();
        expect(item.body).toBeUndefined();
      }
      // Programs stay unpublished until their content is complete.
      expect(p.published).toBe(false);
    }
  });

  it('the 28 Day Reset has the four weekly phases from the client', () => {
    expect(program28.phases.map((ph) => [ph.key, ph.days.length])).toEqual([
      ['release', 7],
      ['restore', 7],
      ['reconnect', 7],
      ['reset', 7],
    ]);
  });
});

describe('progression rules', () => {
  const dayItems = (day: number) => getProgramDays(program28).find((d) => d.day === day)!.items.map((i) => i.id);

  it('opens day 1 only, at first', () => {
    const states = progress.getDayStates(program28, new Set());
    expect(states.get(1)).toBe('available');
    expect(states.get(2)).toBe('locked');
    expect(progress.getCurrentDay(program28, new Set())).toBe(1);
  });

  it('opens the next day once the previous day’s required items are done', () => {
    const done = new Set(dayItems(1));
    const states = progress.getDayStates(program28, done);
    expect(states.get(1)).toBe('completed');
    expect(states.get(2)).toBe('available');
    expect(states.get(3)).toBe('locked');
    expect(progress.getCurrentDay(program28, done)).toBe(2);
  });

  it('cannot skip ahead: a later day done out of order does not open the days after it', () => {
    const done = new Set(dayItems(3));
    expect(progress.isDayOpen(program28, 3, done)).toBe(false);
    expect(progress.getDayStates(program28, done).get(3)).toBe('locked');
  });

  it('intro items never gate and are always open', () => {
    expect(progress.isDayOpen(program1, 0, new Set())).toBe(true);
    expect(findProgramItem(program1, '1d-intro')?.day).toBe(0);
  });

  it('completes the program when every day is complete', () => {
    const all = new Set(getProgramDays(program1).flatMap((d) => d.items.map((i) => i.id)));
    expect(progress.isProgramComplete(program1, all)).toBe(true);
    expect(progress.countCompletedDays(program1, all)).toBe(1);
  });
});

describe('entitlement boundary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('denies anonymous viewers and users without an active entitlement', async () => {
    expect(await entitlements.hasProgramAccess(null, '28-days')).toBe(false);
    (prisma.entitlement.findFirst as any).mockResolvedValue(null);
    expect(await entitlements.hasProgramAccess({ id: 'u1', role: 'USER' }, '28-days')).toBe(false);
    expect((prisma.entitlement.findFirst as any).mock.calls[0][0].where).toEqual({
      userId: 'u1',
      programSlug: '28-days',
      revokedAt: null,
    });
  });

  it('allows an active entitlement; moderators get no implicit access; admins do', async () => {
    (prisma.entitlement.findFirst as any).mockResolvedValue({ id: 'e1' });
    expect(await entitlements.hasProgramAccess({ id: 'u1', role: 'USER' }, '28-days')).toBe(true);
    (prisma.entitlement.findFirst as any).mockResolvedValue(null);
    expect(await entitlements.hasProgramAccess({ id: 'm1', role: 'MODERATOR' }, '28-days')).toBe(false);
    expect(await entitlements.hasProgramAccess({ id: 'a1', role: 'ADMIN' }, '28-days')).toBe(true);
  });

  it('grants idempotently — an existing active entitlement is returned, not duplicated', async () => {
    const tx = { entitlement: { findFirst: vi.fn().mockResolvedValue({ id: 'existing' }), create: vi.fn() } };
    (prisma.$transaction as any).mockImplementation((fn: any) => fn(tx));
    const result = await entitlements.grantProgramAccess({ userId: 'u1', programSlug: '28-days', source: 'ADMIN_GRANT' });
    expect(result).toEqual({ entitlement: { id: 'existing' }, created: false });
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });
});

describe('program progress service', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects completing an item on a locked day', async () => {
    (prisma.programItemCompletion.findMany as any).mockResolvedValue([]);
    const day2Item = getProgramDays(program28)[1].items[0].id;
    await expect(progressService.completeProgramItem('u1', program28, day2Item)).rejects.toMatchObject({ code: 'DAY_LOCKED' });
    expect(prisma.programItemCompletion.upsert).not.toHaveBeenCalled();
  });

  it('rejects unknown items and reflections on locked days', async () => {
    (prisma.programItemCompletion.findMany as any).mockResolvedValue([]);
    await expect(progressService.completeProgramItem('u1', program28, 'nope')).rejects.toMatchObject({ code: 'ITEM_NOT_FOUND' });
    await expect(progressService.saveDayReflection('u1', program28, 5, { note: 'x' })).rejects.toMatchObject({
      code: 'DAY_LOCKED',
    });
  });

  it('marks the enrollment complete when the last required item is done', async () => {
    (prisma.programItemCompletion.findMany as any).mockResolvedValue(
      getProgramDays(program1)[0].items.slice(1).map((i) => ({ itemId: i.id })),
    );
    const result = await progressService.completeProgramItem('u1', program1, getProgramDays(program1)[0].items[0].id);
    expect(result.programComplete).toBe(true);
    expect(prisma.programEnrollment.updateMany).toHaveBeenCalled();
  });
});

describe('program API routes', () => {
  beforeEach(() => vi.clearAllMocks());

  const complete = (slug: string, itemId: string) =>
    completeRoute.POST(new Request('http://x', { method: 'POST' }), { params: { slug, itemId } });

  it('requires sign-in, then access, before touching progress', async () => {
    (getServerSession as any).mockResolvedValue(null);
    expect((await complete('28-days', '28d-d01-1')).status).toBe(401);

    (getServerSession as any).mockResolvedValue({ user: { id: 'u-prog-1', role: 'USER' } });
    (prisma.entitlement.findFirst as any).mockResolvedValue(null);
    expect((await complete('28-days', '28d-d01-1')).status).toBe(403);
    expect(prisma.programItemCompletion.upsert).not.toHaveBeenCalled();

    const reflection = await reflectionRoute.PUT(
      new Request('http://x', { method: 'PUT', body: JSON.stringify({ note: 'hi' }) }),
      { params: { slug: '28-days', day: '1' } },
    );
    expect(reflection.status).toBe(403);
  });

  it('returns 403 DAY_LOCKED when skipping ahead, even with access', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'u-prog-2', role: 'USER' } });
    (prisma.entitlement.findFirst as any).mockResolvedValue({ id: 'e1' });
    (prisma.programItemCompletion.findMany as any).mockResolvedValue([]);
    const res = await complete('28-days', '28d-d05-1');
    expect(res.status).toBe(403);
    expect((await res.json()).error.code).toBe('DAY_LOCKED');
  });

  it('404s unknown programs', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'u-prog-3', role: 'USER' } });
    expect((await complete('99-days', 'x')).status).toBe(404);
  });

  it('admin grants are admin-only', async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: 'u-prog-4', role: 'USER' } });
    const res = await adminRoute.POST(
      new Request('http://x', { method: 'POST', body: JSON.stringify({ email: 'a@b.co', programSlug: '28-days' }) }),
    );
    expect(res.status).toBe(403);
  });
});
