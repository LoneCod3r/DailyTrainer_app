import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyRecaptchaToken } from '@/lib/recaptcha';

beforeEach(() => {
  vi.stubEnv('RECAPTCHA_SECRET_KEY', 'test-secret');
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('verifyRecaptchaToken', () => {
  it('accepts a valid token: success, matching action, score above threshold', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, score: 0.9, action: 'register' }),
    });
    await expect(verifyRecaptchaToken('good-token', '203.0.113.1')).resolves.toBe(true);
  });

  it('rejects when Google reports success: false (invalid token)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    });
    await expect(verifyRecaptchaToken('bad-token')).resolves.toBe(false);
  });

  it('rejects when no token is provided (missing token)', async () => {
    await expect(verifyRecaptchaToken(undefined)).resolves.toBe(false);
    await expect(verifyRecaptchaToken(null)).resolves.toBe(false);
    await expect(verifyRecaptchaToken('')).resolves.toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('rejects a token whose score is below the minimum threshold (likely a bot)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, score: 0.1, action: 'register' }),
    });
    await expect(verifyRecaptchaToken('low-score-token')).resolves.toBe(false);
  });

  it('rejects a token minted for a different action (anti-replay)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, score: 0.9, action: 'login' }),
    });
    await expect(verifyRecaptchaToken('wrong-action-token')).resolves.toBe(false);
  });

  it('rejects when the verify request itself fails (failed server-side verification)', async () => {
    (global.fetch as any).mockRejectedValue(new Error('network down'));
    await expect(verifyRecaptchaToken('some-token')).resolves.toBe(false);
  });

  it('rejects when Google responds with a non-OK HTTP status', async () => {
    (global.fetch as any).mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(verifyRecaptchaToken('some-token')).resolves.toBe(false);
  });

  it('never skips verification in production, even with no secret configured', async () => {
    vi.stubEnv('RECAPTCHA_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'production');
    await expect(verifyRecaptchaToken('any-token')).resolves.toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('allows a dev-only fallback pass when no secret is configured outside production', async () => {
    vi.stubEnv('RECAPTCHA_SECRET_KEY', '');
    vi.stubEnv('NODE_ENV', 'development');
    await expect(verifyRecaptchaToken('any-token')).resolves.toBe(true);
  });
});
