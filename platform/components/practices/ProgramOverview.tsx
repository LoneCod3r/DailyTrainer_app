import { notFound } from 'next/navigation';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { Disclaimer } from './Disclaimer';
import { ProgramDayGrid } from './ProgramDayGrid';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getProgramBySlug } from '@/modules/kuko-way/service';
import { demoProgress } from '@/modules/kuko-way/demo-progress';
import { localize } from '@/modules/kuko-way/types';

// Shared structural layout for the three program lengths (7/14/28 days).
// Which program is "active" is still a fixed demo default (no enrollment
// flow yet — see modules/kuko-way/demo-progress.ts), but the day you're on
// within it is real, derived from this device's completion history (see
// ProgramDayGrid / lib/local-progress.ts). See Prompt2 Day 2 Step 7.
export function ProgramOverview({ slug }: { slug: string }) {
  const locale = getLocale();
  const t = getT(locale);
  const program = getProgramBySlug(slug);
  if (!program) notFound();

  const title = localize(program.title, locale);
  const description = localize(program.description, locale);
  const isActiveProgram = demoProgress.activeProgramSlug === program.slug;

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow={`${t('nav.practices')} · ${t('nav.programs')}`} title={title.value} description={description.value} />

      <ProgramDayGrid program={program} isActiveProgram={isActiveProgram} />

      <Disclaimer t={t} />
    </Container>
  );
}
