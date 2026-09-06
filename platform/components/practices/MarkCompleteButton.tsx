'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import { isPracticeCompleted, setPracticeCompleted } from '@/lib/local-progress';

// Per-viewer "completed" toggle stored in localStorage (see
// lib/local-progress.ts) — a UI foundation only (Prompt2 Day 2 Step 16).
// Deliberately not synced anywhere: there is no practice-tracking backend
// yet, and this must not read as real, shared progress data. It is,
// however, real *device-local* data — Home's "Your progress" widget is
// computed from exactly this.
export function MarkCompleteButton({ practiceSlug }: { practiceSlug: string }) {
  const t = useT();
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setCompleted(isPracticeCompleted(practiceSlug));
  }, [practiceSlug]);

  function toggle() {
    const next = !completed;
    setCompleted(next);
    setPracticeCompleted(practiceSlug, next);
  }

  return (
    <Button variant={completed ? 'secondary' : 'primary'} onClick={toggle}>
      {completed ? `✓ ${t('practiceDetail.completed')}` : t('practiceDetail.markComplete')}
    </Button>
  );
}
