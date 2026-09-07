import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { Errors } from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import { generateToken, hashToken } from '@/lib/tokens';
import { verifyRecaptchaToken } from '@/lib/recaptcha';
import { verifyMathChallenge } from '@/lib/math-challenge';
import { sendVerificationEmail, sendPasswordResetEmail, EmailDeliveryError } from '@/lib/mail';
import { checkRateLimit } from '@/lib/rate-limit';
import { type RegisterInput } from '@/lib/validations/auth';

const log = createLogger('auth.service');
const SALT_ROUNDS = 12;

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// Minimum plausible time (ms) between a form rendering and a human
// submitting it. Paired with the honeypot field as cheap, non-load-bearing
// friction under the real, server-verified CAPTCHA (see lib/recaptcha.ts) —
// see lib/validations/auth.ts for why neither is a security boundary alone.
const MIN_HUMAN_SUBMIT_MS = 1500;

type RegisterOptions = {
  ip: string;
};

export async function registerUser(input: RegisterInput, options: RegisterOptions) {
  const email = input.email.toLowerCase();

  // Honeypot: a real user never sees or fills this field. A filled value
  // means an automated client submitted every input it found — reject with
  // the same generic response a real validation failure would get, so bots
  // don't learn the honeypot exists.
  if (input.website) {
    log.warn('registration rejected: honeypot field filled', { ip: options.ip });
    throw Errors.badRequest('Invalid submission');
  }

  if (
    typeof input.formRenderedAt === 'number' &&
    Date.now() - input.formRenderedAt < MIN_HUMAN_SUBMIT_MS &&
    Date.now() - input.formRenderedAt >= 0
  ) {
    log.warn('registration rejected: submitted implausibly fast', { ip: options.ip });
    throw Errors.badRequest('Invalid submission');
  }

  // Cheap, DB-only check before the network round-trip to Google — lets an
  // obviously-bot submission fail fast without spending a CAPTCHA verify
  // call. Throws with a reason (INVALID/USED/EXPIRED/TOO_MANY_ATTEMPTS/
  // INCORRECT) the client uses to decide whether to just show the error or
  // also fetch a fresh challenge.
  await verifyMathChallenge(input.mathChallengeId, input.mathAnswer, options.ip);

  const captchaOk = await verifyRecaptchaToken(input.captchaToken, options.ip);
  if (!captchaOk) {
    throw Errors.badRequest('Captcha verification failed. Please try again.');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Do not reveal whether the address is already registered — a generic
    // "check your email" style response is returned by the API route either
    // way; only log server-side.
    log.info('registration attempted for existing email', { userId: existing.id });
    throw Errors.conflict('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email,
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      profile: { create: {} },
    },
    select: { id: true, name: true, email: true, role: true, status: true, emailVerified: true },
  });

  log.info('user registered', { userId: user.id });

  try {
    await issueVerificationEmail(user.id, user.email, user.name);
  } catch (err) {
    if (err instanceof EmailDeliveryError) {
      // The account exists but its owner has no way to ever receive a
      // verification link — don't leave that behind. Roll back so the same
      // email address can be retried once delivery is fixed, instead of
      // permanently occupying it with an account nobody can verify. This is
      // the "fail clearly and safely" behavior: the API call fails (500,
      // via withErrorHandling) rather than returning 201 with a "check your
      // email" message for an email that was never actually sent.
      await prisma.user.delete({ where: { id: user.id } }).catch((deleteErr) => {
        log.error('failed to roll back user after email delivery failure', {
          userId: user.id,
          message: (deleteErr as Error)?.message,
        });
      });
      log.error('registration rolled back: verification email could not be sent', { userId: user.id });
      throw Errors.internal('We could not send your verification email. Please try again shortly.');
    }
    throw err;
  }

  return user;
}

// Creates a fresh, single-use email-verification token and sends it. Any
// previously issued, still-unused verification token for this user is
// discarded first, so only the most recently emailed link can ever work.
async function issueVerificationEmail(userId: string, email: string, name: string | null) {
  await prisma.verificationToken.deleteMany({
    where: { userId, type: 'EMAIL_VERIFICATION', usedAt: null },
  });

  const rawToken = generateToken();
  await prisma.verificationToken.create({
    data: {
      userId,
      tokenHash: hashToken(rawToken),
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
    },
  });

  await sendVerificationEmail(email, name, rawToken);
}

export async function verifyEmail(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== 'EMAIL_VERIFICATION') {
    throw Errors.badRequest('This verification link is invalid.', { reason: 'INVALID' });
  }
  if (record.usedAt) {
    throw Errors.badRequest('This verification link has already been used.', { reason: 'USED' });
  }
  if (record.expiresAt < new Date()) {
    throw Errors.badRequest('This verification link has expired.', { reason: 'EXPIRED' });
  }

  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
  ]);

  log.info('email verified', { userId: record.userId });
}

export async function resendVerificationEmail(email: string, ip: string) {
  const normalized = email.toLowerCase();

  if (!checkRateLimit(`verify:resend:email:${normalized}`, 3, 60 * 60_000)) {
    throw Errors.tooManyRequests('Too many verification emails requested. Please try again later.');
  }
  if (!checkRateLimit(`verify:resend:ip:${ip}`, 10, 60 * 60_000)) {
    throw Errors.tooManyRequests('Too many requests. Please try again later.');
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });

  // Always behave the same whether or not the account exists, or is already
  // verified — the API route returns one generic message regardless, so
  // this endpoint can't be used to enumerate registered addresses.
  if (!user || user.emailVerified) {
    log.info('verification resend requested for unknown/verified email', { hasUser: !!user });
    return;
  }

  try {
    await issueVerificationEmail(user.id, user.email, user.name);
  } catch (err) {
    if (err instanceof EmailDeliveryError) {
      // Unlike registration, this endpoint's contract is "always the same
      // generic response, whether or not the account exists" — letting a
      // delivery failure turn into a distinct error response here would let
      // an attacker distinguish "account exists but SMTP is down" from
      // "no such account" during an SMTP outage. Log loudly for operators
      // (this is a real, actionable problem) but don't change what the
      // caller sees; the user still has the resend button to try again
      // once delivery is restored.
      log.error('verification resend: email delivery failed', { userId: user.id });
      return;
    }
    throw err;
  }
}

export async function requestPasswordReset(email: string, ip: string) {
  const normalized = email.toLowerCase();

  if (!checkRateLimit(`reset:request:email:${normalized}`, 3, 60 * 60_000)) {
    throw Errors.tooManyRequests('Too many reset requests. Please try again later.');
  }
  if (!checkRateLimit(`reset:request:ip:${ip}`, 10, 60 * 60_000)) {
    throw Errors.tooManyRequests('Too many requests. Please try again later.');
  }

  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user || !user.passwordHash) {
    log.info('password reset requested for unknown email or non-credentials account', { hasUser: !!user });
    return;
  }

  await prisma.verificationToken.deleteMany({
    where: { userId: user.id, type: 'PASSWORD_RESET', usedAt: null },
  });

  const rawToken = generateToken();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(rawToken),
      type: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  try {
    await sendPasswordResetEmail(user.email, user.name, rawToken);
  } catch (err) {
    if (err instanceof EmailDeliveryError) {
      // Same reasoning as resendVerificationEmail: stay enumeration-safe by
      // not changing the caller-visible response on a delivery failure —
      // just log it loudly for operators.
      log.error('password reset: email delivery failed', { userId: user.id });
      return;
    }
    throw err;
  }
}

export async function resetPassword(rawToken: string, newPassword: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== 'PASSWORD_RESET') {
    throw Errors.badRequest('This reset link is invalid.', { reason: 'INVALID' });
  }
  if (record.usedAt) {
    throw Errors.badRequest('This reset link has already been used.', { reason: 'USED' });
  }
  if (record.expiresAt < new Date()) {
    throw Errors.badRequest('This reset link has expired.', { reason: 'EXPIRED' });
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    // Completing a password-reset link is equally strong proof of control
    // over the address as the verification-link flow — if the account
    // wasn't verified yet, this satisfies it too (see User.emailVerified).
    // Also clears any lockout, since the owner has just proven control.
    prisma.user.update({
      where: { id: record.userId },
      data: {
        passwordHash,
        emailVerified: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    }),
    // A password reset invalidates any other in-flight verification token
    // for this user (e.g. an older, still-valid email-verification link).
    prisma.verificationToken.deleteMany({
      where: { userId: record.userId, type: 'EMAIL_VERIFICATION', usedAt: null },
    }),
  ]);

  log.info('password reset', { userId: record.userId });
}
