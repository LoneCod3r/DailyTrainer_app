'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

// Per-viewer "completed" toggle stored in localStorage — a UI foundation
// only (Prompt2 Day 2 Step 16). Deliberately not synced anywhere: there is
// no practice-tracking backend yet, and this must not read as real,
// shared progress data.
export function MarkCompleteButton({ practiceSlug }: { practiceSlug: string }) {
  const t = useT();
  const key = `ptd:completed:${practiceSlug}`;
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    try {
      setCompleted(localStorage.getItem(key) === '1');
    } catch {
      // localStorage unavailable — button just won't remember state.
    }
  }, [key]);

  function toggle() {
    const next = !completed;
    setCompleted(next);
    try {
      if (next) localStorage.setItem(key, '1');
      else localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  return (
    <Button variant={completed ? 'secondary' : 'primary'} onClick={toggle}>
      {completed ? `✓ ${t('practiceDetail.completed')}` : t('practiceDetail.markComplete')}
    </Button>
  );
}
