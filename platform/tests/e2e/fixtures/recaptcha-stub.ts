import type { Page } from '@playwright/test';

// Offline stand-in for Google reCAPTCHA v3, so specs about the reCAPTCHA
// lifecycle are deterministic and don't depend on Google's network. It
// reproduces the parts of the real script's behavior that the app has to
// manage. Each was observed against the real script while diagnosing the
// consent-withdrawal bug:
//   - api.js defines `window.grecaptcha` and `___grecaptcha_cfg`, injects a
//     second "release" script from gstatic, and adds a `.grecaptcha-badge`
//     holding an iframe;
//   - `execute()` resolves asynchronously and, when its response arrives,
//     writes `_grecaptcha` to localStorage, but only while its iframe is still
//     attached. A request still in flight therefore recreates `_grecaptcha`
//     after the app has removed it, unless the integration was torn down.
// Set E2E_REAL_RECAPTCHA=1 to run the same specs against the real script.
export const STUB_TOKEN = 'e2e-stub-recaptcha-token';
export const STUB_EXECUTE_DELAY_MS = 3000;

const API_JS = `(() => {
  if (window.grecaptcha) return;
  window.___grecaptcha_cfg = { clients: {} };
  const holder = document.createElement('div');
  const badge = document.createElement('div');
  badge.className = 'grecaptcha-badge';
  const frame = document.createElement('iframe');
  frame.src = 'https://www.google.com/recaptcha/api2/anchor?stub=1';
  badge.appendChild(frame);
  holder.appendChild(badge);
  document.body.appendChild(holder);
  const release = document.createElement('script');
  release.src = 'https://www.gstatic.com/recaptcha/releases/stub/recaptcha__en.js';
  document.head.appendChild(release);
  window.grecaptcha = {
    ready: (cb) => setTimeout(cb, 0),
    execute: () => new Promise((resolve) => setTimeout(() => {
      if (frame.isConnected) localStorage.setItem('_grecaptcha', 'stub');
      resolve('${STUB_TOKEN}');
    }, ${STUB_EXECUTE_DELAY_MS})),
  };
})();`;

export async function stubRecaptcha(page: Page): Promise<void> {
  if (process.env.E2E_REAL_RECAPTCHA === '1') return;
  await page.route('https://www.google.com/recaptcha/api.js*', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: API_JS }),
  );
  await page.route('https://www.gstatic.com/recaptcha/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: '' }),
  );
  await page.route('https://www.google.com/recaptcha/api2/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
  );
}

// Everything the integration leaves in the page, for asserting it's gone.
export async function recaptchaFootprint(page: Page) {
  return page.evaluate(() => ({
    grecaptcha: typeof window.grecaptcha !== 'undefined',
    cfg: typeof (window as unknown as { ___grecaptcha_cfg?: unknown }).___grecaptcha_cfg !== 'undefined',
    scripts: document.querySelectorAll('script[src*="/recaptcha/"]').length,
    badge: document.querySelectorAll('.grecaptcha-badge').length,
    iframes: document.querySelectorAll('iframe[src*="/recaptcha/"]').length,
    storage: localStorage.getItem('_grecaptcha') !== null,
  }));
}

export const NO_RECAPTCHA = { grecaptcha: false, cfg: false, scripts: 0, badge: 0, iframes: 0, storage: false };
