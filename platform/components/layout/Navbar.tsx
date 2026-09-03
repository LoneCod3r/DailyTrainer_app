'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Container, Button } from '@/components/ui';
import { isAdmin } from '@/lib/permissions';
import { clsx } from '@/lib/clsx';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/membership', label: 'Membership' },
  { href: '/articles', label: 'Articles', comingSoon: true },
  { href: '/courses', label: 'Courses', comingSoon: true },
  { href: '/events', label: 'Events', comingSoon: true },
  { href: '/community', label: 'Community', comingSoon: true },
];

export function Navbar({ appName }: { appName: string }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-sand-200/80 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-ink-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            {appName.charAt(0).toUpperCase()}
          </span>
          <span className="hidden sm:inline">{appName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <span key={link.href} className="relative">
              <Link
                href={link.comingSoon ? '#' : link.href}
                aria-disabled={link.comingSoon}
                title={link.comingSoon ? 'Coming soon' : undefined}
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  link.comingSoon
                    ? 'cursor-not-allowed text-ink-300'
                    : pathname === link.href
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-700 hover:bg-sand-100',
                )}
                onClick={(e) => link.comingSoon && e.preventDefault()}
              >
                {link.label}
              </Link>
            </span>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {status === 'loading' ? null : session?.user ? (
            <>
              {isAdmin(session.user.role) && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    Admin
                  </Button>
                </Link>
              )}
              <Link href="/account">
                <Button variant="secondary" size="sm">
                  {session.user.name ?? 'Account'}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/' })}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Join
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <span className="sr-only">Toggle menu</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </Container>

      {open && (
        <div className="border-t border-sand-200 bg-white md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.comingSoon ? '#' : link.href}
                onClick={(e) => {
                  if (link.comingSoon) e.preventDefault();
                  setOpen(false);
                }}
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm font-medium',
                  link.comingSoon ? 'text-ink-300' : 'text-ink-700 hover:bg-sand-100',
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-sand-200 pt-3">
              {session?.user ? (
                <>
                  {isAdmin(session.user.role) && (
                    <Link href="/admin" onClick={() => setOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Link href="/account" onClick={() => setOpen(false)}>
                    <Button variant="secondary" className="w-full justify-start">
                      {session.user.name ?? 'Account'}
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => signOut({ callbackUrl: '/' })}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button variant="primary" className="w-full justify-start">
                      Join
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
