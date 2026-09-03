import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { donationAmountSchema, createDonationCheckoutSchema } from '@/lib/validations/billing';

describe('auth validations', () => {
  it('accepts a valid login payload', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(loginSchema.safeParse({ email: 'not-an-email', password: 'x' }).success).toBe(false);
  });

  it('rejects a short registration password', () => {
    const result = registerSchema.safeParse({ name: 'Test User', email: 'a@b.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid registration payload', () => {
    const result = registerSchema.safeParse({ name: 'Test User', email: 'a@b.com', password: 'longenoughpw' });
    expect(result.success).toBe(true);
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
