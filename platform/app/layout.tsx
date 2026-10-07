import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { cookies } from 'next/headers';
import { getLocale } from '@/lib/i18n/get-locale';
import { getPublicLegalConfig } from '@/modules/legal/legal.service';
import { CONSENT_COOKIE, parseConsent } from '@/modules/legal/cookie-consent';

// Fonts (Manrope + the "KUKO Display" serif) are self-hosted @font-face
// rules in globals.css, which also defines --font-sans / --font-serif.

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'KUKO WAY',
    template: '%s · KUKO WAY',
  },
  description: 'Your personal practice space for the KUKO WAY method.',
};

// Applies the persisted theme before first paint so switching between light
// and dark mode never flashes the wrong theme on load.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  // Legal/consent state is resolved here, once per request, so the cookie
  // banner, footer and registration form all render correctly in the first
  // HTML response (see components/legal/LegalProvider.tsx).
  const legalConfig = getPublicLegalConfig();
  const consent = parseConsent(cookies().get(CONSENT_COOKIE)?.value, legalConfig.cookiePolicyVersion);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-page font-sans text-ink-900 antialiased">
        <Providers locale={locale} legalConfig={legalConfig} consent={consent}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
