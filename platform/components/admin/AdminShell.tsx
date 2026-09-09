'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { Role } from '@prisma/client';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from './AdminHeader';

const COLLAPSE_KEY = 'admin-sidebar-collapsed';

export function AdminShell({
  appName,
  user,
  children,
}: {
  appName: string;
  user: { name: string | null; email: string | null; role: Role };
  children: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  // null until mounted — avoids a hydration mismatch from reading localStorage.
  const [collapsed, setCollapsed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      setCollapsed(false);
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        // localStorage unavailable — collapse state just won't persist.
      }
      return next;
    });
  }

  return (
    <div className="flex min-h-screen bg-page">
      <AdminSidebar
        appName={appName}
        collapsed={collapsed ?? false}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onToggleCollapsed={toggleCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader user={user} onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="px-4 py-4 text-center text-xs text-ink-300 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {appName}. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
