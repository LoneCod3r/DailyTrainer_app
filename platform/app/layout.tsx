import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/layout/Providers';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSettings } from '@/modules/settings/settings.service';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const serif = Fraunces({ subsets: ['latin'], variable: '--font-serif', weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: 'Community Platform',
  description: 'A modern community and educational platform.',
};

// This layout reads Settings from the database on every request (app name
// shown in the Navbar/Footer), so it must not be statically prerendered at
// build time.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} min-h-screen bg-white font-sans text-ink-900 antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <Navbar appName={settings.appName} />
            <main className="flex-1">{children}</main>
            <Footer appName={settings.appName} />
          </div>
        </Providers>
      </body>
    </html>
  );
}
