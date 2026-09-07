import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    mathChallenge: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  },
}));

const { prisma } = await import('@/lib/prisma');
const { generateMathChallenge, verifyMathChallenge } = await import('@/lib/math-challenge');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('generateMathChallenge', () => {
  it('returns a challengeId and a question, never the answer', async () => {
    (prisma.mathChallenge.create as any).mockResolvedValue({ id: 'chal-1' });

    const result = await generateMathChallenge('203.0.113.10');

    expect(result.challengeId).toBe('chal-1');
    expect(result.question).toMatch(/^\d+ \+ \d+$/);
    // The only thing ever written back to the caller — no `answer` key at all.
    expect(Object.keys(result).sort()).toEqual(['challengeId', 'question']);
  });

  it('persists the answer server-side, keyed off two random operands', async () => {
    (prisma.mathChallenge.create as any).mockResolvedValue({ id: 'chal-2' });

    await generateMathChallenge('203.0.113.11');

    const call = (prisma.mathChallenge.create as any).mock.calls[0][0];
    expect(typeof call.data.answer).toBe('number');
    expect(call.data.answer).toBeGreaterThanOrEqual(2); // 1 + 1 minimum
    expect(call.data.answer).toBeLessThanOrEqual(198); // 99 + 99 maximum
    expect(call.data.expiresAt).toBeInstanceOf(Date);
  });

  it('generates independent challenges on repeated calls (not the same question/answer every time)', async () => {
    (prisma.mathChallenge.create as any)
      .mockResolvedValueOnce({ id: 'chal-a' })
      .mockResolvedValueOnce({ id: 'chal-b' })
      .mockResolvedValueOnce({ id: 'chal-c' });

    const results = await Promise.all([
      generateMathChallenge('203.0.113.12'),
      generateMathChallenge('203.0.113.12'),
      generateMathChallenge('203.0.113.12'),
    ]);

    const ids = results.map((r) => r.challengeId);
    expect(new Set(ids).size).toBe(3);
    const answers = (prisma.mathChallenge.create as any).mock.calls.map((c: any) => c[0].data.answer);
    // Not a hard guarantee (random collisions are possible), but three calls
    // producing the exact same sum every time would indicate a static/fixed
    // challenge rather than a randomly generated one.
    expect(new Set(answers).size).toBeGreaterThan(1);
  });

  it('is rate limited per IP', async () => {
    (prisma.mathChallenge.create as any).mockResolvedValue({ id: 'chal-rl' });
    const ip = '203.0.113.13';

    for (let i = 0; i < 30; i++) {
      await generateMathChallenge(ip);
    }
    await expect(generateMathChallenge(ip)).rejects.toMatchObject({ status: 429 });
  });
});

describe('verifyMathChallenge', () => {
  const IP = '198.51.100.1';

  it('accepts a correct answer and marks the challenge consumed', async () => {
    (prisma.mathChallenge.findUnique as any).mockResolvedValue({
      id: 'chal-1',
      answer: 113,
      attempts: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(verifyMathChallenge('chal-1', 113, IP)).resolves.toBeUndefined();

    expect(prisma.mathChallenge.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'chal-1' },
        data: expect.objectContaining({ consumedAt: expect.any(Date) }),
      }),
    );
  });

  it('rejects an incorrect answer, without consuming the challenge', async () => {
    (prisma.mathChallenge.findUnique as any).mockResolvedValue({
      id: 'chal-2',
      answer: 113,
      attempts: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(verifyMathChallenge('chal-2', 999, IP)).rejects.toMatchObject({
      status: 400,
      details: { reason: 'INCORRECT' },
    });

    const updateArgs = (prisma.mathChallenge.update as any).mock.calls[0][0];
    expect(updateArgs.data.consumedAt).toBeUndefined();
    expect(updateArgs.data.attempts).toEqual({ increment: 1 });
  });

  it('rejects a missing/unknown challenge id as invalid', async () => {
    (prisma.mathChallenge.findUnique as any).mockResolvedValue(null);

    await expect(verifyMathChallenge('does-not-exist', 42, IP)).rejects.toMatchObject({
      status: 400,
      details: { reason: 'INVALID' },
    });
    expect(prisma.mathChallenge.update).not.toHaveBeenCalled();
  });

  it('rejects an expired challenge', async () => {
    (prisma.mathChallenge.findUnique as any).mockResolvedValue({
      id: 'chal-3',
      answer: 50,
      attempts: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });

    await expect(verifyMathChallenge('chal-3', 50, IP)).rejects.toMatchObject({
      status: 400,
      details: { reason: 'EXPIRED' },
    });
    expect(prisma.mathChallenge.update).not.toHaveBeenCalled();
  });

  it('rejects a challenge that was already used, even with the right answer', async () => {
    (prisma.mathChallenge.findUnique as any).mockResolvedValue({
      id: 'chal-4',
      answer: 50,
      attempts: 1,
      consumedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(verifyMathChallenge('chal-4', 50, IP)).rejects.toMatchObject({
      status: 400,
      details: { reason: 'USED' },
    });
    expect(prisma.mathChallenge.update).not.toHaveBeenCalled();
  });

  it('rejects once the attempt cap is reached, even with the right answer', async () => {
    (prisma.mathChallenge.findUnique as any).mockResolvedValue({
      id: 'chal-5',
      answer: 50,
      attempts: 5,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(verifyMathChallenge('chal-5', 50, IP)).rejects.toMatchObject({
      status: 400,
      details: { reason: 'TOO_MANY_ATTEMPTS' },
    });
    expect(prisma.mathChallenge.update).not.toHaveBeenCalled();
  });

  it('is rate limited per IP independently of any single challenge', async () => {
    (prisma.mathChallenge.findUnique as any).mockResolvedValue({
      id: 'chal-6',
      answer: 50,
      attempts: 0,
      consumedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const ip = '198.51.100.2';

    for (let i = 0; i < 30; i++) {
      await verifyMathChallenge('chal-6', 999, ip).catch(() => {});
    }
    await expect(verifyMathChallenge('chal-6', 999, ip)).rejects.toMatchObject({ status: 429 });
  });
});
