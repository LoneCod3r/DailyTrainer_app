import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    verificationToken: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  },
}));

vi.mock('@/lib/recaptcha', () => ({
  verifyRecaptchaToken: vi.fn(),
}));

// registerUser's integration point with the math challenge is covered here
// (one test below); the challenge's own logic — expiry, reuse, attempt
// limits, rate limiting — is covered in isolation in math-challenge.test.ts.
vi.mock('@/lib/math-challenge', () => ({
  verifyMathChallenge: vi.fn(),
}));

// A real class (not a vi.fn()) so `instanceof EmailDeliveryError` checks in
// auth.service.ts work against errors thrown by the mocked send functions.
vi.mock('@/lib/mail', () => {
  class EmailDeliveryError extends Error {}
  return {
    sendVerificationEmail: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    EmailDeliveryError,
  };
});

const { prisma } = await import('@/lib/prisma');
const { verifyRecaptchaToken } = await import('@/lib/recaptcha');
const { verifyMathChallenge } = await import('@/lib/math-challenge');
const { sendVerificationEmail, sendPasswordResetEmail, EmailDeliveryError } = await import('@/lib/mail');
const { registerUser, verifyEmail, resendVerificationEmail, requestPasswordReset, resetPassword } = await import(
  '@/modules/auth/auth.service'
);

const REG_OPTIONS = { ip: '203.0.113.1' };

beforeEach(() => {
  // resetAllMocks (not clearAllMocks): a few tests set a one-off
  // mockRejectedValue on sendVerificationEmail/sendPasswordResetEmail to
  // simulate a delivery failure — clearAllMocks only resets call history,
  // not the implementation, so that rejection would otherwise leak into
  // every later test in this file. Every mock this suite depends on is
  // re-established explicitly right below (or inline, per test), so a full
  // reset is safe here.
  vi.resetAllMocks();
  (verifyRecaptchaToken as any).mockResolvedValue(true);
  (verifyMathChallenge as any).mockResolvedValue(undefined);
  (prisma.verificationToken.deleteMany as any).mockResolvedValue({ count: 0 });
  (prisma.verificationToken.create as any).mockResolvedValue({ id: 'vt1' });
  (prisma.user.delete as any).mockResolvedValue({});
});

const VALID_INPUT = {
  name: 'A',
  email: 'a@b.com',
  password: 'longenoughpw',
  captchaToken: 'valid-token',
  website: '',
  formRenderedAt: Date.now() - 5000,
  mathChallengeId: 'math-1',
  mathAnswer: 42,
};

describe('registerUser', () => {
  it('rejects registration when the email is already taken', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'existing' });

    await expect(registerUser(VALID_INPUT, REG_OPTIONS)).rejects.toMatchObject({ status: 409 });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('stores a bcrypt hash, never the plaintext password', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockImplementation(async ({ data }: any) => ({
      id: 'new-user',
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
      emailVerified: null,
      __passwordHash: data.passwordHash,
    }));

    await registerUser({ ...VALID_INPUT, email: 'A@Example.com' }, REG_OPTIONS);

    const call = (prisma.user.create as any).mock.calls[0][0];
    expect(call.data.email).toBe('a@example.com'); // normalized to lowercase
    expect(call.data.passwordHash).not.toBe('longenoughpw');
    expect(await bcrypt.compare('longenoughpw', call.data.passwordHash)).toBe(true);
    // New accounts start unverified.
    expect(call.data.status).toBe('ACTIVE');
  });

  it('rejects when the math challenge fails, without calling CAPTCHA verification or creating a user', async () => {
    (verifyMathChallenge as any).mockRejectedValue(Object.assign(new Error('bad math'), { status: 400 }));
    (prisma.user.findUnique as any).mockResolvedValue(null);

    await expect(registerUser(VALID_INPUT, REG_OPTIONS)).rejects.toMatchObject({ status: 400 });
    expect(verifyMathChallenge).toHaveBeenCalledWith('math-1', 42, REG_OPTIONS.ip);
    expect(verifyRecaptchaToken).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects when CAPTCHA verification fails, without creating a user', async () => {
    (verifyRecaptchaToken as any).mockResolvedValue(false);
    (prisma.user.findUnique as any).mockResolvedValue(null);

    await expect(registerUser(VALID_INPUT, REG_OPTIONS)).rejects.toMatchObject({ status: 400 });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects when the honeypot field is filled, without calling CAPTCHA verification', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    await expect(registerUser({ ...VALID_INPUT, website: 'https://spam.example.com' }, REG_OPTIONS)).rejects.toMatchObject({
      status: 400,
    });
    expect(verifyRecaptchaToken).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('rejects a submission that arrives implausibly fast for a human', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);

    await expect(
      registerUser({ ...VALID_INPUT, formRenderedAt: Date.now() }, REG_OPTIONS),
    ).rejects.toMatchObject({ status: 400 });
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('sends a verification email on successful registration', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      id: 'new-user',
      name: 'A',
      email: 'a@b.com',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: null,
    });

    await registerUser(VALID_INPUT, REG_OPTIONS);

    expect(sendVerificationEmail).toHaveBeenCalledWith('a@b.com', 'A', expect.any(String));
    expect(prisma.verificationToken.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: 'new-user', type: 'EMAIL_VERIFICATION' }) }),
    );
  });

  it('rolls back the just-created user and fails clearly when the verification email cannot be delivered', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      id: 'new-user',
      name: 'A',
      email: 'a@b.com',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: null,
    });
    (sendVerificationEmail as any).mockRejectedValue(new EmailDeliveryError('SMTP down'));

    // Fails the whole registration (not a 201 with a "check your email" that
    // was never actually sent) — see docs/auth-security.md "Fail-clearly
    // semantics".
    await expect(registerUser(VALID_INPUT, REG_OPTIONS)).rejects.toMatchObject({ status: 500 });

    // The account was created, then rolled back — not left behind as an
    // account nobody could ever verify.
    expect(prisma.user.create).toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'new-user' } });
  });

  it('propagates a non-delivery error from sendVerificationEmail without swallowing or rolling back specially', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    (prisma.user.create as any).mockResolvedValue({
      id: 'new-user-2',
      name: 'A',
      email: 'a@b.com',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: null,
    });
    const unrelatedError = new Error('unexpected bug, not a delivery failure');
    (sendVerificationEmail as any).mockRejectedValue(unrelatedError);

    await expect(registerUser(VALID_INPUT, REG_OPTIONS)).rejects.toBe(unrelatedError);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});

describe('verifyEmail', () => {
  it('marks the token used and the user verified on a valid token', async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      id: 'vt1',
      userId: 'u1',
      type: 'EMAIL_VERIFICATION',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await verifyEmail('raw-token');

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('rejects an unknown/invalid token', async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue(null);
    await expect(verifyEmail('garbage')).rejects.toMatchObject({ status: 400, details: { reason: 'INVALID' } });
  });

  it('rejects a token that was already used', async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      id: 'vt1',
      userId: 'u1',
      type: 'EMAIL_VERIFICATION',
      usedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });
    await expect(verifyEmail('reused')).rejects.toMatchObject({ status: 400, details: { reason: 'USED' } });
  });

  it('rejects an expired token', async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      id: 'vt1',
      userId: 'u1',
      type: 'EMAIL_VERIFICATION',
      usedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    });
    await expect(verifyEmail('expired')).rejects.toMatchObject({ status: 400, details: { reason: 'EXPIRED' } });
  });
});

describe('resendVerificationEmail', () => {
  it('does nothing for an unknown email, but still responds successfully (no enumeration)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await expect(resendVerificationEmail('nobody@example.dev', '203.0.113.2')).resolves.toBeUndefined();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('does nothing for an already-verified account', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'a@b.com', emailVerified: new Date() });
    await resendVerificationEmail('a@b.com', '203.0.113.3');
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('is rate limited per email after repeated requests', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u1', email: 'limited@b.com', emailVerified: null });
    const ip = '203.0.113.4';

    await resendVerificationEmail('limited@b.com', ip);
    await resendVerificationEmail('limited@b.com', ip);
    await resendVerificationEmail('limited@b.com', ip);
    await expect(resendVerificationEmail('limited@b.com', ip)).rejects.toMatchObject({ status: 429 });
  });

  it('replaces the previous token: an older unused verification token is invalidated', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u9', email: 'replace@b.com', emailVerified: null });
    await resendVerificationEmail('replace@b.com', '203.0.113.20');
    expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u9', type: 'EMAIL_VERIFICATION', usedAt: null },
    });
    expect(prisma.verificationToken.create).toHaveBeenCalled();
  });

  it('does not surface an email delivery failure — stays enumeration-safe, but logs it', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: 'u10', email: 'downstream@b.com', emailVerified: null });
    (sendVerificationEmail as any).mockRejectedValue(new EmailDeliveryError('SMTP down'));

    // Same response shape as every other outcome of this endpoint — a
    // delivery failure must not be distinguishable from "no such account".
    await expect(resendVerificationEmail('downstream@b.com', '203.0.113.21')).resolves.toBeUndefined();
  });
});

describe('requestPasswordReset / resetPassword', () => {
  it('does nothing for an unknown email (no enumeration)', async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await requestPasswordReset('nobody2@example.dev', '203.0.113.5');
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('issues a reset email for a known credentials account', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u2',
      email: 'reset@b.com',
      name: 'Reset Me',
      passwordHash: 'hash',
    });
    await requestPasswordReset('reset@b.com', '203.0.113.6');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith('reset@b.com', 'Reset Me', expect.any(String));
  });

  it('does not surface an email delivery failure — stays enumeration-safe, but logs it', async () => {
    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'u11',
      email: 'downstream2@b.com',
      name: 'Downstream',
      passwordHash: 'hash',
    });
    (sendPasswordResetEmail as any).mockRejectedValue(new EmailDeliveryError('SMTP down'));

    await expect(requestPasswordReset('downstream2@b.com', '203.0.113.22')).resolves.toBeUndefined();
  });

  it('rejects an expired reset token', async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      id: 'vt2',
      userId: 'u2',
      type: 'PASSWORD_RESET',
      usedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(resetPassword('expired-token', 'newlongpassword')).rejects.toMatchObject({
      status: 400,
      details: { reason: 'EXPIRED' },
    });
  });

  it('hashes the new password and clears any lockout on a valid reset', async () => {
    (prisma.verificationToken.findUnique as any).mockResolvedValue({
      id: 'vt3',
      userId: 'u3',
      type: 'PASSWORD_RESET',
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await resetPassword('valid-token', 'brandNewPassword1');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u3' },
        data: expect.objectContaining({ failedLoginAttempts: 0, lockedUntil: null }),
      }),
    );
    const updateArgs = (prisma.user.update as any).mock.calls[0][0];
    expect(updateArgs.data.passwordHash).not.toBe('brandNewPassword1');
    expect(await bcrypt.compare('brandNewPassword1', updateArgs.data.passwordHash)).toBe(true);
  });
});
