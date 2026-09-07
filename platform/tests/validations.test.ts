import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth';
import { donationAmountSchema, createDonationCheckoutSchema } from '@/lib/validations/billing';

const VALID_REGISTER = {
  name: 'Test User',
  email: 'a@b.com',
  password: 'longenoughpw',
  captchaToken: 'token-123',
  mathChallengeId: 'math-1',
  mathAnswer: 42,
};

describe('auth validations', () => {
  it('accepts a valid login payload', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
  });

  it('rejects a short registration password', () => {
    const result = registerSchema.safeParse({ ...VALID_REGISTER, password: 'short' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse(VALID_REGISTER);
    expect(result.success).toBe(true);
  });

  it('rejects registration when the CAPTCHA token is missing', () => {
    const { captchaToken, ...withoutCaptcha } = VALID_REGISTER;
    void captchaToken;
    expect(registerSchema.safeParse(withoutCaptcha).success).toBe(false);
  });

  it('rejects registration when the CAPTCHA token is an empty string', () => {
    expect(registerSchema.safeParse({ ...VALID_REGISTER, captchaToken: '' }).success).toBe(false);
  });

  it('defaults the honeypot field to empty when omitted', () => {
    const result = registerSchema.parse(VALID_REGISTER);
    expect(result.website).toBe('');
  });

  it('rejects registration when the math challenge id is missing', () => {
    const { mathChallengeId, ...withoutId } = VALID_REGISTER;
    void mathChallengeId;
    expect(registerSchema.safeParse(withoutId).success).toBe(false);
  });

  it('rejects registration when the math answer is missing', () => {
    const { mathAnswer, ...withoutAnswer } = VALID_REGISTER;
    void mathAnswer;
    expect(registerSchema.safeParse(withoutAnswer).success).toBe(false);
  });

  it('coerces a numeric-string math answer (as a form input would send)', () => {
    const result = registerSchema.safeParse({ ...VALID_REGISTER, mathAnswer: '42' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mathAnswer).toBe(42);
  });

  it('rejects a non-numeric math answer', () => {
    expect(registerSchema.safeParse({ ...VALID_REGISTER, mathAnswer: 'not-a-number' }).success).toBe(false);
  });

  it('accepts a resend-verification payload with a valid email', () => {
    expect(resendVerificationSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });

  it('rejects a resend-verification payload with an invalid email', () => {
    expect(resendVerificationSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('accepts a non-empty verify-email token', () => {
    expect(verifyEmailSchema.safeParse({ token: 'abc' }).success).toBe(true);
  });

  it('rejects an empty verify-email token', () => {
    expect(verifyEmailSchema.safeParse({ token: '' }).success).toBe(false);
  });

  it('accepts a valid forgot-password payload', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });

  it('rejects a reset-password payload with a short new password', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'short' }).success).toBe(false);
  });

  it('accepts a valid reset-password payload', () => {
    expect(resetPasswordSchema.safeParse({ token: 'abc', password: 'longenoughpw' }).success).toBe(true);
  });
});

describe('billing validations', () => {
  it('rejects a donation amount below the minimum', () => {
    expect(donationAmountSchema.safeParse(50).success).toBe(false);
  });

  it('rejects a non-integer donation amount (fractional cents)', () => {
    expect(donationAmountSchema.safeParse(1000.5).success).toBe(false);
  });

  it('accepts a valid donation amount', () => {
    expect(donationAmountSchema.safeParse(2500).success).toBe(true);
  });

  it('rejects an unsupported currency for donation checkout', () => {
    const result = createDonationCheckoutSchema.safeParse({ amount: 1000, currency: 'usd' });
    expect(result.success).toBe(false);
  });

  it('defaults currency to eur when omitted', () => {
    const result = createDonationCheckoutSchema.parse({ amount: 1000 });
    expect(result.currency).toBe('eur');
  });
});
