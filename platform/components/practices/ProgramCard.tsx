import Link from 'next/link';
import { Card, Badge } from '@/components/ui';
import { ProgressBar } from './ProgressBar';
import { localize, type Program } from '@/modules/kuko-way/types';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';

export function ProgramCard({
  program,
  locale,
  t,
  currentDay,
}: {
  program: Program;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  // Present only when this program is the visitor's active one (demo data
  // today — see modules/kuko-way/demo-progress.ts).
  currentDay?: number;
}) {
  const title = localize(program.title, locale);
  const description = localize(program.description, locale);
  const isActive = typeof currentDay === 'number';

  return (
    <Link href={`/practices/programs/${program.slug}`}>
      <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-soft">
        <div className="flex items-center justify-between gap-2">
          <Badge tone="brand" className="w-fit">
            {program.length} {t('programs.daysUnit')}
          </Badge>
          {isActive && <Badge tone="success">{t('programs.current')}</Badge>}
        </div>
        <h3 className="text-lg font-semibold text-ink-900">{title.value}</h3>
        <p className="text-sm text-ink-500">{description.value}</p>

        {isActive && currentDay ? (
          <div className="mt-auto flex flex-col gap-1.5 pt-2">
            <ProgressBar value={currentDay} max={program.length} label={t('home.dayOf', { current: currentDay, total: program.length })} />
            <p className="text-xs text-ink-500">{t('home.dayOf', { current: currentDay, total: program.length })}</p>
          </div>
        ) : (
          <div className="mt-auto pt-2">
            <span className="text-sm font-medium text-link">{t('programs.startProgram')} →</span>
          </div>
        )}
      </Card>
    </Link>
  );
}
