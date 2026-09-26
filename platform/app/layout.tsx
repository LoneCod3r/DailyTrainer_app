import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { getLocale } from '@/lib/i18n/get-locale';

// Self-hosted so `next build` never depends on the live Google Fonts service
// (next/font/google intermittently failed CI builds). The files are Google
// Fonts' own full-coverage static builds (Inter v20, Fraunces v38), so Inter
// still covers Cyrillic for the BG locale. Preloading is off because
// next/font/local would preload every listed weight on every page.
const sans = localFont({
  src: [
    { path: './fonts/inter-100.woff2', weight: '100', style: 'normal' },
    { path: './fonts/inter-200.woff2', weight: '200', style: 'normal' },
    { path: './fonts/inter-300.woff2', weight: '300', style: 'normal' },
    { path: './fonts/inter-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/inter-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/inter-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/inter-700.woff2', weight: '700', style: 'normal' },
    { path: './fonts/inter-800.woff2', weight: '800', style: 'normal' },
    { path: './fonts/inter-900.woff2', weight: '900', style: 'normal' },
  ],
  variable: '--font-sans',
  preload: false,
});
const serif = localFont({
  src: [
    { path: './fonts/fraunces-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/fraunces-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/fraunces-600.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-serif',
  preload: false,
  // Matches the serif fallback next/font/google generated for Fraunces.
  adjustFontFallback: 'Times New Roman',
});

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
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${sans.variable} ${serif.variable} min-h-screen bg-page font-sans text-ink-900 antialiased`}>
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  );
}
