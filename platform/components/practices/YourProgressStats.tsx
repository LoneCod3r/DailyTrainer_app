'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/LocaleProvider';
import { getLocalProgressSummary, type LocalProgressSummary } from '@/lib/local-progress';

const EMPTY: LocalProgressSummary = { practicesCompleted: 0, streakDays: 0 };

// Real numbers from this device's own completion history (see
// lib/local-progress.ts), not placeholder data — reads as 0/0 until mounted
// so it never flashes a stale or invented value.
export function YourProgressStats() {
  const t = useT();
  const [summary, setSummary] = useState<LocalProgressSummary>(EMPTY);

  useEffect(() => {
    setSummary(getLocalProgressSummary());
  }, []);

  return (
    <>
      <div data-testid="streak-stat">
        <p className="text-xl font-semibold text-ink-900">{summary.streakDays}</p>
        <p className="text-xs text-ink-500">{t('home.currentStreak')}</p>
      </div>
      <div data-testid="practices-completed-stat">
        <p className="text-xl font-semibold text-ink-900">{summary.practicesCompleted}</p>
        <p className="text-xs text-ink-500">{t('home.practicesCompleted')}</p>
      </div>
    </>
  );
}
