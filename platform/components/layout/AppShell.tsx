'use client';

import { useState, type ReactNode } from 'react';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileDrawer } from './MobileDrawer';
import { VerificationBanner } from './VerificationBanner';

// The persistent application shell used by the Home / Practices / Community
// / Account experience (app/(app)) — a topbar (logo + primary nav + search +
// account) on desktop, bottom nav + drawer on mobile. There is no fixed left
// sidebar — Home/Practices/Community live in the topbar itself. Auth pages
// and the admin panel intentionally use their own lighter chrome, not this
// shell.
export function AppShell({ appName, children }: { appName: string; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page">
      <div className="flex min-h-screen flex-col">
        <Topbar appName={appName} onOpenMenu={() => setDrawerOpen(true)} />
        <VerificationBanner />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
