import { defineConfig, devices } from '@playwright/test';

// E2E tests run against the real Next.js dev server + local Postgres (same
// stack `npm run dev` uses) — no separate test-only architecture. See
// tests/e2e/fixtures/auth.setup.ts for how the one authenticated identity
// (the seeded `member@example.dev` demo account) is prepared once and reused
// via storageState, and tests/e2e/fixtures/base.ts for why most specs pin
// the locale to English rather than relying on the bg default.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // A single `next dev` process + single local Postgres instance back every
  // worker's requests — too much parallelism here saturates the dev server
  // itself (slow/cold rendering, not a real app bug) rather than actually
  // speeding the suite up.
  workers: process.env.CI ? 1 : 2,
  reporter: [['html', { open: 'never' }], ['list']],
  // Generous relative to a typical CI e2e config: this runs against `next
  // dev`, which compiles each route on its first hit (a real, one-time cost
  // per route — not app latency), and `fullyParallel` means many routes get
  // hit for the first time concurrently across workers.
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Primary project: the full journey suite runs here. responsive.spec.ts
    // is 375px-viewport-specific and belongs to `mobile-chrome` only.
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: /responsive\.spec\.ts/,
      dependencies: ['setup'],
    },

    // Cross-browser coverage stays intentionally small — only tests tagged
    // @smoke run here, so the full suite isn't multiplied 3x.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      grep: /@smoke/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grep: /@smoke/,
    },

    // Responsive smoke coverage at the ~375px mobile viewport the task asks
    // for (a real device profile for touch/UA, with the viewport pinned to
    // 375x812 rather than the profile's native size).
    {
      name: 'mobile-chrome',
      testMatch: /responsive\.spec\.ts/,
      use: { ...devices['Pixel 5'], viewport: { width: 375, height: 812 } },
      dependencies: ['setup'],
    },
  ],

  // Reuses your already-running `npm run dev` if there is one; otherwise
  // starts it and waits for it to be ready. Requires the local Postgres in
  // DATABASE_URL to be reachable and migrated/seeded (see README.md).
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Registration E2E specs (security-hardening.spec.ts) post the fake token
    // 'e2e-test-recaptcha-token'. lib/recaptcha.ts only accepts that outside
    // production when no secret is configured (dev-only fallback), so a real
    // secret in the developer's local .env would send those tokens to Google
    // and fail. An explicitly empty value takes precedence over .env (Next
    // never overrides variables already present in the environment) without
    // touching the real file. Only applies when Playwright starts the server
    // itself — an already-running `npm run dev` (reuseExistingServer) keeps
    // its own environment.
    env: { RECAPTCHA_SECRET_KEY: '' },
  },
});
