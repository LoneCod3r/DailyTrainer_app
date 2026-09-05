'use client';

import { useEffect, useState } from 'react';
import { clsx } from '@/lib/clsx';
import { SunIcon, MoonIcon } from './icons';

export function ThemeToggle({ className }: { className?: string }) {
  // null until mounted — avoids guessing the theme during SSR/hydration.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      // localStorage unavailable (private mode, etc.) — theme just won't persist.
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={clsx(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-700 hover:bg-sand-100',
        className,
      )}
    >
      {dark === null ? <span className="h-5 w-5" /> : dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
