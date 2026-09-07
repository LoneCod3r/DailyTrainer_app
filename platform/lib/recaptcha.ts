import { createLogger } from '@/lib/logger';

const log = createLogger('recaptcha');

const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

// The action every registration token must have been minted for (see
// components/auth/Recaptcha.tsx's grecaptcha.execute(siteKey, { action })).
// v3 best practice: rejecting a mismatched action stops a token obtained for
// one form/flow from being replayed against another.
const EXPECTED_ACTION = 'register';

// Google's own suggested cutoff: 1.0 is very likely a human, 0.0 very
// likely a bot. 0.5 is the same default Google's own docs use as a
// starting point.
const MIN_SCORE = 0.5;

type SiteVerifyResponse = {
  success: boolean;
  score?: number;
  action?: string;
  'error-codes'?: string[];
};

// Google reCAPTCHA v3 — chosen over v2 (checkbox/"I'm not a robot") for the
// lowest-friction experience: it runs invisibly and scores every visitor
// instead of interrupting legitimate ones with a puzzle. Verification is a
// single server-side POST; the client only ever produces an opaque token
// (components/auth/Recaptcha.tsx), never a pass/fail decision.
export async function verifyRecaptchaToken(token: string | undefined | null, remoteIp?: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    // No key configured: only acceptable outside production (local dev
    // without a Google reCAPTCHA account — Google does not publish a
    // universal "always passes" test key pair that works on any
    // unregistered domain, so there's no real-network equivalent to fall
    // back to here). Never silently skip verification in production — that
    // would make the whole check a no-op.
    if (process.env.NODE_ENV === 'production') {
      log.error('RECAPTCHA_SECRET_KEY is not configured in production; refusing to skip CAPTCHA verification');
      return false;
    }
    log.warn('RECAPTCHA_SECRET_KEY not set — skipping CAPTCHA verification (dev-only fallback)');
    return true;
  }

  if (!token) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp);

    const res = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!res.ok) {
      log.warn('recaptcha verify request failed', { httpStatus: res.status });
      return false;
    }

    const data = (await res.json()) as SiteVerifyResponse;

    if (!data.success) {
      log.info('recaptcha verification rejected', { errorCodes: data['error-codes'] });
      return false;
    }
    if (data.action !== undefined && data.action !== EXPECTED_ACTION) {
      log.warn('recaptcha token was minted for a different action', { action: data.action });
      return false;
    }
    if (typeof data.score === 'number' && data.score < MIN_SCORE) {
      log.info('recaptcha score below threshold', { score: data.score });
      return false;
    }

    return true;
  } catch (err) {
    log.error('recaptcha verify request threw', { message: (err as Error)?.message });
    return false;
  }
}
