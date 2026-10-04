import { test, expect } from '@playwright/test';

// The baseline security headers from next.config.js's global headers() rule
// must reach every kind of response: rendered pages, API routes and static
// files. HSTS and Cross-Origin-Embedder-Policy are deliberately not sent (HSTS
// depends on the production HTTPS setup; COEP would break cross-origin images
// and the reCAPTCHA iframe) — asserted here so they aren't added by accident.
const EXPECTED_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'content-security-policy': "frame-ancestors 'none'",
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'cross-origin-opener-policy': 'same-origin',
};

const MUST_BE_ABSENT = ['x-powered-by', 'strict-transport-security', 'cross-origin-embedder-policy'];

const ROUTES = [
  { label: 'home page', path: '/' },
  { label: 'login page', path: '/login' },
  { label: 'API route', path: '/api/settings' },
  { label: 'static asset', path: '/images/home/library.jpeg' },
];

test.describe('Security headers', () => {
  for (const { label, path } of ROUTES) {
    test(`${label} (${path}) sends the baseline security headers`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(200);

      const headers = res.headers();
      for (const [name, value] of Object.entries(EXPECTED_HEADERS)) {
        expect(headers[name], name).toBe(value);
      }
      for (const name of MUST_BE_ABSENT) {
        expect(headers[name], name).toBeUndefined();
      }
    });
  }
});
