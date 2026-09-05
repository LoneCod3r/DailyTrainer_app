import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: 'KUKO WAY',
  description: 'Your personal practice space for the KUKO WAY method.',
};

// Applies the persisted theme before first paint so switching between light
// and dark mode never flashes the wrong theme on load.
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`${sans.variable} ${serif.variable} min-h-screen bg-page font-sans text-ink-900 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
