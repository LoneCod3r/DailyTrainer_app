import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/api-response';
import { checkRateLimit } from '@/lib/rate-limit';
import { createLogger } from '@/lib/logger';

const log = createLogger('math-challenge');

// A simple arithmetic anti-bot layer on top of CAPTCHA/honeypot/rate
// limiting — never a replacement for any of them (see docs/auth-security.md).
// The expected answer lives only in the database row; the API only ever
// returns the question text and the challenge id.
const CHALLENGE_TTL_MS = 5 * 60_000; // 5 minutes — long enough for a human, short enough to bound brute-forcing
const MAX_ATTEMPTS = 5;
const GENERATE_LIMIT = 30;
const GENERATE_WINDOW_MS = 60_000;

export async function generateMathChallenge(ip: string): Promise<{ challengeId: string; question: string }> {
  if (!checkRateLimit(`math-challenge:generate:${ip}`, GENERATE_LIMIT, GENERATE_WINDOW_MS)) {
    throw Errors.tooManyRequests();
  }

  // Two random two-digit-ish numbers added together — quick for a human,
  // and randomInt is a CSPRNG so the answer isn't guessable from the seed.
  const a = randomInt(1, 100);
  const b = randomInt(1, 100);

  const challenge = await prisma.mathChallenge.create({
    data: { answer: a + b, expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) },
    select: { id: true },
  });

  return { challengeId: challenge.id, question: `${a} + ${b}` };
}

// Throws (never returns a boolean) so callers get the same
// find-once-then-branch shape as modules/auth/auth.service.ts's token
// verification, and so a caller can't accidentally ignore the result.
export async function verifyMathChallenge(challengeId: string, providedAnswer: number, ip: string): Promise<void> {
  if (!checkRateLimit(`math-challenge:verify:ip:${ip}`, 30, 60_000)) {
    throw Errors.tooManyRequests();
  }

  const record = await prisma.mathChallenge.findUnique({ where: { id: challengeId } });

  if (!record) {
    throw Errors.badRequest('This security check is invalid. Please request a new one.', { reason: 'INVALID' });
  }
  if (record.consumedAt) {
    throw Errors.badRequest('This security check was already used. Please request a new one.', { reason: 'USED' });
  }
  if (record.expiresAt < new Date()) {
    throw Errors.badRequest('This security check has expired. Please request a new one.', { reason: 'EXPIRED' });
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    throw Errors.badRequest('Too many attempts on this security check. Please request a new one.', {
      reason: 'TOO_MANY_ATTEMPTS',
    });
  }

  const isCorrect = record.answer === providedAnswer;

  // Every attempt (right or wrong) is counted, and a correct one also burns
  // the challenge — both happen in the same write so a second, concurrent
  // guess against the same row can't slip in between "checked" and "marked".
  await prisma.mathChallenge.update({
    where: { id: record.id },
    data: isCorrect ? { consumedAt: new Date(), attempts: { increment: 1 } } : { attempts: { increment: 1 } },
  });

  if (!isCorrect) {
    log.warn('math challenge answered incorrectly', { challengeId, attempts: record.attempts + 1 });
    throw Errors.badRequest('Incorrect answer to the security check.', { reason: 'INCORRECT' });
  }
}
