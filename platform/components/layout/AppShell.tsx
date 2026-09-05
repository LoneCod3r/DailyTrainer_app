'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileDrawer } from './MobileDrawer';

// The persistent application shell used by the Home / Practices / Community
// / Account experience (app/(app)) — a fixed sidebar + topbar on desktop,
// bottom nav + drawer on mobile. Auth pages and the admin panel intentionally
// use their own lighter chrome, not this shell.
export function AppShell({ appName, children }: { appName: string; children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-page">
      <Sidebar appName={appName} />
      <div className="flex min-h-screen flex-col md:pl-64">
        <Topbar onOpenMenu={() => setDrawerOpen(true)} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
