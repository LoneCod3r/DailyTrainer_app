'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';
import { getCurrentProgramDay } from '@/lib/local-progress';
import { demoProgress } from '@/modules/kuko-way/demo-progress';
import type { DictKey } from '@/lib/i18n/dictionaries';

const TRAIL: { slug: '7-days' | '14-days' | '28-days'; length: number; titleKey: DictKey; descKey: DictKey }[] = [
  { slug: '7-days', length: 7, titleKey: 'nav.days7', descKey: 'programs.days7desc' },
  { slug: '14-days', length: 14, titleKey: 'nav.days14', descKey: 'programs.days14desc' },
  { slug: '28-days', length: 28, titleKey: 'nav.days28', descKey: 'programs.days28desc' },
];

const activeIndex = TRAIL.findIndex((p) => p.slug === demoProgress.activeProgramSlug);

// A single connected step-trail for 7/14/28 instead of three independent
// cards — the line's fill is the active program's real day-X-of-N progress
// (see lib/local-progress.ts), so 7/14/28 read as one ascending journey with
// a visible "you are here", not three unrelated plans to compare. Starts
// with nothing filled before mount so it never flashes a stale value.
export function ProgramTrail() {
  const t = useT();
  const [currentDay, setCurrentDay] = useState<number | null>(null);

  useEffect(() => {
    setCurrentDay(getCurrentProgramDay(TRAIL[activeIndex].length));
  }, []);

  const fillPct =
    currentDay === null ? 0 : ((activeIndex + currentDay / TRAIL[activeIndex].length) / TRAIL.length) * 100;

  return (
    <div className="relative flex flex-col gap-8 sm:flex-row sm:gap-4">
      {/* Track + fill — duplicated per axis (mobile: vertical, desktop:
          horizontal) rather than one element switching CSS properties by
          media query, since a single inline style can't condition on
          breakpoint. Each node's own opaque circle background masks the
          line passing behind it, so no z-index juggling is needed. */}
      <div aria-hidden="true" className="absolute left-[1.15rem] top-2 bottom-2 w-px bg-sand-200 sm:hidden" />
      <div
        aria-hidden="true"
        className="absolute left-[1.15rem] top-2 w-px bg-brand-500 transition-[height] sm:hidden"
        style={{ height: `${fillPct}%` }}
      />
      <div
        aria-hidden="true"
        className="absolute left-[16.6667%] right-[16.6667%] top-[1.15rem] hidden h-px bg-sand-200 sm:block"
      />
      <div
        aria-hidden="true"
        className="absolute left-[16.6667%] top-[1.15rem] hidden h-px bg-brand-500 transition-[width] sm:block"
        style={{ width: `${(fillPct / 100) * (200 / 3)}%` }}
      />

      {TRAIL.map((program, index) => {
        const isActive = index === activeIndex;
        const isCompleted = index < activeIndex;
        return (
          <Link
            key={program.slug}
            href={`/practices/programs/${program.slug}`}
            className="group relative flex flex-1 flex-row items-start gap-4 text-left sm:flex-col sm:items-center sm:gap-3 sm:text-center"
          >
            <span
              className={clsx(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-page text-sm font-semibold transition-colors',
                isCompleted && 'border-brand-500 bg-brand-500 text-white',
                isActive && 'border-brand-500 text-link',
                !isActive && !isCompleted && 'border-sand-300 text-ink-500',
              )}
            >
              {program.length}
            </span>
            <span className="flex flex-col gap-1 pt-1 sm:pt-0">
              <span className="font-serif text-lg text-ink-900 group-hover:text-link sm:text-xl">
                {t(program.titleKey)}
              </span>
              <span className="max-w-[16rem] text-sm text-ink-500 sm:max-w-[14rem]">{t(program.descKey)}</span>
              {isActive && currentDay !== null && (
                <span className="text-xs font-medium text-link">
                  {t('home.dayOf', { current: currentDay, total: program.length })}
                </span>
              )}
              <span className="pt-1 text-sm font-medium text-link">
                {isActive ? t('programs.continueProgram') : t('programs.startProgram')} →
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
