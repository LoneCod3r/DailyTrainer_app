import type { FullConfig } from '@playwright/test';

// `next dev` compiles each route on its first request. When that first
// request happens mid-test (e.g. page.goto('/admin') as a Moderator), the
// dev server's HMR pushes a Fast Refresh full reload to every open tab, which
// interrupts an in-flight page.goto() ("Navigation to ... is interrupted by
// another navigation to ..."). Seen in isolated WebKit runs of
// moderator-boundary.spec.ts against a cold server.
//
// Playwright starts `webServer` (and waits for it to answer) before running
// globalSetup, so by now the server is up. Plain, unauthenticated HTTP GETs
// compile each route entry — including redirecting routes like /admin, which
// compile before the layout's redirect() runs — and there is no browser tab
// open yet to receive an HMR reload.
const WARM_ROUTES = [
  '/',
  '/login',
  '/admin',
  '/admin/users',
  '/admin/settings',
  '/admin/membership',
  '/moderation',
  '/moderation/reports',
  '/moderation/discussions',
  '/moderation/users',
  '/moderation/history',
  '/account',
  '/account/settings',
  '/account/billing',
  '/account/membership',
  '/account/donation',
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/csrf',
];

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL = config.projects[0]?.use.baseURL ?? 'http://localhost:3000';

  for (const route of WARM_ROUTES) {
    // Any HTTP status (200, 3xx, 401/403) means the route compiled; only a
    // request that cannot complete at all (server unreachable) throws.
    // redirect: 'manual' — the goal is to compile this route's own entry,
    // not whatever it redirects to.
    const res = await fetch(new URL(route, baseURL), { redirect: 'manual' });
    await res.arrayBuffer();
  }
}
