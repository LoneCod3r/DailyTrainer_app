import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, Card, CardContent, Button } from '@/components/ui';
import { ProgramItemView } from '@/components/programs/ProgramItemView';
import { DayReflectionForm } from '@/components/programs/DayReflectionForm';
import { Disclaimer } from '@/components/practices/Disclaimer';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT, type DictKey } from '@/lib/i18n/dictionaries';
import { localize } from '@/modules/kuko-way/types';
import { POST_FEELINGS, type PostFeeling } from '@/modules/kuko-way/check-ins';
import { getPhaseForDay, getProgramDay, getProgramDays, getVisibleProgram } from '@/modules/programs/service';
import { getCurrentDay, getDayStates, isDayComplete } from '@/modules/programs/progress';
import { getCompletedItemIds, getDayReflection } from '@/modules/programs/progress.service';
import { hasProgramAccess } from '@/modules/commerce/entitlements.service';
import type { DaySlot, ProgramItem } from '@/modules/programs/types';

export function generateMetadata({ params }: { params: { slug: string; day: string } }): Metadata {
  const program = getVisibleProgram(params.slug);
  if (!program) return {};
  const t = getT(getLocale());
  return { title: `${t('resetPrograms.dayLabel', { day: params.day })} · ${localize(program.title, getLocale()).value}` };
}

const SLOT_ORDER: (DaySlot | undefined)[] = ['MORNING', undefined, 'DAY', 'EVENING'];

// The gated program player for one day. Server-side checks, in order:
// signed in → program exists → access (hasProgramAccess — the single
// entitlement boundary) → day open (sequential unlock). Nothing paid is
// rendered before all four pass; the progress APIs repeat the same checks.
export default async function ProgramDayPage({ params }: { params: { slug: string; day: string } }) {
  const program = getVisibleProgram(params.slug);
  const dayNumber = Number(params.day);
  if (!program || !Number.isInteger(dayNumber)) notFound();
  const day = getProgramDay(program, dayNumber);
  if (!day) notFound();

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/practices/programs/${program.slug}/day/${dayNumber}`)}`);
  }

  const locale = getLocale();
  const t = getT(locale);
  const programTitle = localize(program.title, locale).value;
  const backLink = (
    <Link href={`/practices/programs/${program.slug}`} className="text-sm font-medium text-link hover:underline">
      ← {t('resetPrograms.backToProgram')}
    </Link>
  );

  if (!(await hasProgramAccess(session.user, program.slug))) {
    return (
      <Container className="flex max-w-3xl flex-col gap-6 py-8">
        {backLink}
        <Card className="bg-sand-50" data-testid="program-no-access">
          <CardContent className="flex flex-col gap-2">
            <h1 className="text-xl font-semibold text-ink-900">{t('resetPrograms.noAccessTitle')}</h1>
            <p className="text-ink-700">{t('resetPrograms.noAccessDesc')}</p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const completed = await getCompletedItemIds(session.user.id, program.slug);
  const state = getDayStates(program, completed).get(dayNumber);
  const currentDay = getCurrentDay(program, completed);

  if (state === 'locked') {
    return (
      <Container className="flex max-w-3xl flex-col gap-6 py-8">
        {backLink}
        <Card data-testid="program-day-locked">
          <CardContent className="flex flex-col items-start gap-3">
            <h1 className="text-xl font-semibold text-ink-900">
              {t('resetPrograms.dayLabel', { day: dayNumber })} · {t('resetPrograms.stateLocked')}
            </h1>
            <p className="text-ink-700">{t('resetPrograms.lockedDesc')}</p>
            <Link href={`/practices/programs/${program.slug}/day/${currentDay}`}>
              <Button variant="secondary">{t('resetPrograms.goToCurrentDay', { day: currentDay })} →</Button>
            </Link>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const totalDays = getProgramDays(program).length;
  const phase = program.phases.length > 1 ? getPhaseForDay(program, dayNumber) : undefined;
  const reflection = await getDayReflection(session.user.id, program.slug, dayNumber);
  const dayComplete = isDayComplete(day, completed);
  const nextDay = dayNumber < totalDays ? dayNumber + 1 : undefined;
  const introItems = dayNumber === 1 ? program.introItems : [];
  const groups = SLOT_ORDER.map((slot) => ({ slot, items: day.items.filter((item) => item.slot === slot) })).filter(
    (g) => g.items.length > 0,
  );
  const reflectionFeeling = POST_FEELINGS.find((f) => f === reflection?.feeling) as PostFeeling | undefined;

  const renderItem = (item: ProgramItem) => (
    <ProgramItemView
      key={item.id}
      programSlug={program.slug}
      item={item}
      done={completed.has(item.id)}
      locale={locale}
      t={t}
    />
  );

  return (
    <Container className="flex max-w-3xl flex-col gap-8 py-8">
      {backLink}

      <header className="flex flex-col gap-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-clay">
          {programTitle}
          {phase ? ` · ${localize(phase.title, locale).value}` : ''}
        </p>
        <h1 className="font-serif text-4xl text-ink-900 sm:text-5xl">
          {t('resetPrograms.dayOf', { current: dayNumber, total: totalDays })}
        </h1>
        {day.title && <p className="text-lg text-ink-700">{localize(day.title, locale).value}</p>}
      </header>

      {introItems.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-serif text-2xl text-ink-900">{t('resetPrograms.beforeYouBegin')}</h2>
          {introItems.map(renderItem)}
        </section>
      )}

      {groups.map((group) => (
        <section key={group.slot ?? 'any'} className="flex flex-col gap-4">
          {group.slot && (
            <h2 className="font-serif text-2xl text-ink-900">{t(`resetPrograms.slots.${group.slot}` as DictKey)}</h2>
          )}
          {group.items.map(renderItem)}
        </section>
      ))}

      <DayReflectionForm
        programSlug={program.slug}
        day={dayNumber}
        prompt={day.reflectionPrompt ? localize(day.reflectionPrompt, locale).value : t('resetPrograms.noticeLead')}
        initialFeeling={reflectionFeeling}
        initialNote={reflection?.note ?? undefined}
      />

      {dayComplete && (
        <Card className="bg-brand-tint" data-testid="program-day-complete">
          <CardContent className="flex flex-col items-start gap-3">
            <p className="font-serif text-2xl text-ink-900">
              {nextDay ? t('resetPrograms.dayComplete') : t('resetPrograms.programComplete')}
            </p>
            {nextDay && (
              <Link href={`/practices/programs/${program.slug}/day/${nextDay}`}>
                <Button>{t('resetPrograms.nextDay', { day: nextDay })} →</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      <Disclaimer t={t} />
    </Container>
  );
}
