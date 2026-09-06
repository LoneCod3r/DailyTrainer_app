import { notFound } from 'next/navigation';
import { Container, Card, CardContent, Badge, Button } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProgressBar } from './ProgressBar';
import { Disclaimer } from './Disclaimer';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getProgramBySlug } from '@/modules/kuko-way/service';
import { demoProgress } from '@/modules/kuko-way/demo-progress';
import { localize } from '@/modules/kuko-way/types';
import { clsx } from '@/lib/clsx';

// Shared structural layout for the three program lengths (7/14/28 days).
// The handbook never assigns specific practices to specific days, so
// day-by-day content stays a locked placeholder — only the day the visitor
// is on (demo data) is marked current/completed. See Prompt2 Day 2 Step 7.
export function ProgramOverview({ slug }: { slug: string }) {
  const locale = getLocale();
  const t = getT(locale);
  const program = getProgramBySlug(slug);
  if (!program) notFound();

  const title = localize(program.title, locale);
  const description = localize(program.description, locale);
  const isActiveProgram = demoProgress.activeProgramSlug === program.slug;
  const currentDay = isActiveProgram ? demoProgress.currentDay : 0;

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow={`${t('nav.practices')} · ${t('nav.programs')}`} title={title.value} description={description.value} />

      {isActiveProgram ? (
        <Card>
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink-900">{t('programs.yourProgress')}</span>
              <span className="text-sm text-ink-500">{t('home.dayOf', { current: currentDay, total: program.length })}</span>
            </div>
            <ProgressBar value={currentDay} max={program.length} />
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

      <Disclaimer t={t} />
    </Container>
  );
}
