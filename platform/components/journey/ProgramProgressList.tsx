import Link from 'next/link';
import { Badge } from '@/components/ui';
import { ProgressBar } from '@/components/practices/ProgressBar';
import { localize } from '@/modules/kuko-way/types';
import type { ResetProgram } from '@/modules/programs/types';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';

export interface ProgramProgressRow {
  program: ResetProgram;
  totalDays: number;
  completedDays: number;
  currentDay: number;
  complete: boolean;
}

// "Your programs" on Journey and Profile (concept §10/§16: "28 Day Reset —
// 17/28"). Server component; data comes from getProgramProgressOverview().
// `variant="card"` is for use inside a card that already provides the frame
// (Journey's dashboard grid): no dashed box around the empty state, which
// keeps its link at the bottom, and a single-column list.
export function ProgramProgressList({
  rows,
  locale,
  t,
  variant = 'default',
}: {
  rows: ProgramProgressRow[];
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  variant?: 'default' | 'card';
}) {
  const inCard = variant === 'card';

  if (rows.length === 0) {
    return (
      <div
        className={
          inCard
            ? 'flex flex-1 flex-col items-start justify-between gap-4'
            : 'flex flex-col items-start gap-2 rounded-2xl border border-dashed border-sand-300 p-5'
        }
      >
        <p className="text-ink-700">{t('journey.programsEmpty')}</p>
        <Link href="/practices/programs" className="font-medium text-link hover:underline">
          {t('journey.exploreProgramsCta')} →
        </Link>
      </div>
    );
  }

  return (
    <ul className={inCard ? 'grid gap-4' : 'grid gap-4 sm:grid-cols-2'}>
      {rows.map((row) => {
        const label = t('journey.daysCompleted', { count: row.completedDays, total: row.totalDays });
        return (
          <li key={row.program.slug}>
            <Link
              href={
                row.complete
                  ? `/practices/programs/${row.program.slug}`
                  : `/practices/programs/${row.program.slug}/day/${row.currentDay}`
              }
              className="flex h-full flex-col gap-3 rounded-2xl border border-sand-200 bg-surface p-5 transition-shadow hover:shadow-soft"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif text-xl text-ink-900">{localize(row.program.title, locale).value}</span>
                {row.complete && <Badge tone="success">{t('journey.programComplete')}</Badge>}
              </div>
              <ProgressBar value={row.completedDays} max={row.totalDays} label={label} />
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink-500">{label}</span>
                {!row.complete && (
                  <span className="font-medium text-link">{t('resetPrograms.continueDay', { day: row.currentDay })} →</span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
