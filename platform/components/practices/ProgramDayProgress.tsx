'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n/LocaleProvider';
import { getCurrentProgramDay } from '@/lib/local-progress';
import { ProgressBar } from './ProgressBar';

// Real "day X of N" for Home's Continue-your-program card — see
// lib/local-progress.ts's getCurrentProgramDay for what "real" means here
// (there's no per-day content backend, so this is usage-derived, not
// invented). Starts at day 1 before mount so it never flashes a stale value.
export function ProgramDayProgress({ programLength }: { programLength: number }) {
  const t = useT();
  const [day, setDay] = useState(1);

  useEffect(() => {
    setDay(getCurrentProgramDay(programLength));
  }, [programLength]);

  const label = t('home.dayOf', { current: day, total: programLength });

  return (
    <>
      <ProgressBar value={day} max={programLength} label={label} />
      <p className="text-xs text-ink-500">{label}</p>
    </>
  );
}
