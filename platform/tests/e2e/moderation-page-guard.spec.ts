import { test, expect } from './fixtures/base';
import type { APIRequestContext } from '@playwright/test';
import { AUTH_STORAGE_STATE, DEMO_USER } from './fixtures/data';

// Regression for a layout-only authorization gap: app/moderation/layout.tsx
// redirects non-moderators, but on a client-side (RSC) navigation Next.js
// skips re-rendering layouts the client says it already has and renders only
// the page segment. A plain page.goto() always runs the layout, so it can't
// catch this — these tests send the RSC navigation request directly, claiming
// the moderation layout is already mounted, exactly as the router would.
const MODERATION_PAGES = [
  '/moderation',
  '/moderation/reports',
  '/moderation/history',
  '/moderation/discussions',
  '/moderation/users',
];

// Router state tree for "currently on another /moderation/* page" — tells the
// server the moderation layout is already rendered on the client.
function mountedModerationTree(path: string): string {
  const current = path === '/moderation/users' ? 'reports' : 'users';
  const tree = ['', { children: ['moderation', { children: [current, { children: ['__PAGE__', {}] }] }] }, null, null, true];
  return encodeURIComponent(JSON.stringify(tree));
}

async function rscNavigate(request: APIRequestContext, path: string) {
  const res = await request.get(path, {
    headers: { RSC: '1', 'Next-Router-State-Tree': mountedModerationTree(path) },
    maxRedirects: 0,
  });
  return { status: res.status(), body: await res.text() };
}

test.describe('Moderation pages enforce authorization themselves (not only via the layout)', () => {
  for (const path of MODERATION_PAGES) {
    test(`@smoke anonymous RSC navigation to ${path} is redirected to login and leaks no moderation data`, async ({
      playwright,
      baseURL,
    }) => {
      const anonymous = await playwright.request.newContext({ baseURL });
      const { body } = await rscNavigate(anonymous, path);
      await anonymous.dispose();

      expect(body).toContain('NEXT_REDIRECT');
      expect(body).toContain('/login?callbackUrl=/moderation');
      // Seeded member emails are what /moderation/users exposed before the fix.
      expect(body).not.toContain(DEMO_USER.email);
      expect(body).not.toContain('@example.dev');
    });
  }

  test.describe('signed in as a regular member', () => {
    test.use({ storageState: AUTH_STORAGE_STATE });

    test('RSC navigation to /moderation/users redirects home and leaks no member data', async ({ page }) => {
      const { body } = await rscNavigate(page.request, '/moderation/users');
      expect(body).toContain('NEXT_REDIRECT');
      expect(body).not.toContain('/login?callbackUrl');
      expect(body).not.toContain('@example.dev');
    });
  });
});
