'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, Badge, Button } from '@/components/ui';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';
import { getCurrentProgramDay } from '@/lib/local-progress';
import type { Program } from '@/modules/kuko-way/types';
import { ProgressBar } from './ProgressBar';

// Real "day X of N" and per-day completed/current/locked badges — see
// lib/local-progress.ts's getCurrentProgramDay for what "real" means here.
// Starts at day 1 before mount so it never flashes a stale value.
export function ProgramDayGrid({ program, isActiveProgram }: { program: Program; isActiveProgram: boolean }) {
  const t = useT();
  const [currentDay, setCurrentDay] = useState(1);

  useEffect(() => {
    if (isActiveProgram) setCurrentDay(getCurrentProgramDay(program.length));
  }, [isActiveProgram, program.length]);

  return (
    <>
      {isActiveProgram ? (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-900">{t('programs.yourProgress')}</span>
              <span className="text-sm text-ink-500">{t('home.dayOf', { current: currentDay, total: program.length })}</span>
            </div>
            <ProgressBar
              value={currentDay}
              max={program.length}
              label={t('home.dayOf', { current: currentDay, total: program.length })}
            />
            <div className="pt-1">
              <Button size="sm">{t('programs.continueProgram')}</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-ink-500">{t('programs.comingSoonDesc')}</p>
            <div className="pt-1">
              <Button size="sm" variant="secondary">
                {t('programs.startProgram')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-7">
        {Array.from({ length: program.length }, (_, i) => i + 1).map((day) => {
          const state = !isActiveProgram ? 'locked' : day < currentDay ? 'completed' : day === currentDay ? 'current' : 'locked';
          return (
            <Card key={day} className={clsx(state === 'locked' && 'opacity-60')}>
              <CardContent className="flex flex-col items-center gap-1 p-3 text-center">
                <span className="text-sm font-semibold text-ink-900">{t('programs.dayLabel', { day })}</span>
                <Badge tone={state === 'completed' ? 'success' : state === 'current' ? 'brand' : 'neutral'}>
                  {t(`programs.${state}`)}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
