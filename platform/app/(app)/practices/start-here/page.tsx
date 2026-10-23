import Link from 'next/link';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getStartHereSections } from '@/modules/kuko-way/service';
import { localize } from '@/modules/kuko-way/types';
import { START_HERE_PHASES } from '@/modules/kuko-way/handbook';

// Start Here = orientation and first steps only: get to know KUKO WAY, get
// ready for the first practice, then practise. The handbook's background
// chapters (fascia, the body, body zones, …) live in Learn — each chapter has
// exactly one home (modules/kuko-way/handbook.ts), so nothing is duplicated.

export default function StartHerePage() {
  const locale = getLocale();
  const t = getT(locale);
  const sections = getStartHereSections();
  const byId = new Map(sections.map((s) => [s.id, s]));

  return (
    <Container className="flex flex-col gap-10 py-8">
      <PageHeader centered eyebrow={t('nav.practices')} title={t('startHere.title')} description={t('startHere.subtitle')} />

      {/* The two phases side by side from lg up (stacked below, in order).
          Each chapter is one compact unit: its small step number on the
          title's line, the serif title as the only link, and its short
          website-only summary (content/start-here-summaries.ts) flush
          beneath, shown in full. The chapter pages keep the full source
          text. */}
      {/* From lg up the two phases share one 4-row grid (heading + three
          chapters), each phase and its list taking those rows via subgrid —
          so heading pairs with heading and 01↔04, 02↔05, 03↔06 always start
          on the same row, whichever summary is longer. */}
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-6">
        {START_HERE_PHASES.map((phase, phaseIndex) => (
          <section
            key={phase.labelKey}
            aria-labelledby={`start-here-phase-${phaseIndex + 1}`}
            className="flex min-w-0 flex-col gap-5 lg:row-span-4 lg:grid lg:grid-rows-subgrid lg:gap-y-6"
          >
            <h2
              id={`start-here-phase-${phaseIndex + 1}`}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500"
            >
              {t(phase.labelKey)}
            </h2>
            <ol className="flex flex-col gap-6 lg:row-span-3 lg:grid lg:grid-rows-subgrid">
              {phase.sectionIds.map((id) => {
                const section = byId.get(id);
                if (!section) return null;
                const step = sections.findIndex((s) => s.id === id) + 1;
                const title = localize(section.title, locale);
                // The chapter's website-only summary; its opening paragraph
                // only as a fallback.
                const preview = section.summary ?? section.paragraphs?.[0] ?? section.subsections?.[0]?.paragraphs[0];
                const previewText = preview ? localize(preview, locale) : undefined;
                return (
                  <li key={id} className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2.5">
                      <span aria-hidden className="shrink-0 text-xs font-semibold tabular-nums text-clay">
                        {String(step).padStart(2, '0')}
                      </span>
                      <Link
                        href={`/practices/start-here/${section.slug}`}
                        className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                      >
                        <h3 className="font-serif text-xl leading-snug text-ink-900 underline decoration-sand-300 decoration-1 underline-offset-[0.25em] motion-safe:transition-colors group-hover:text-link group-hover:decoration-clay-fill">
                          {title.value}
                        </h3>
                      </Link>
                    </div>
                    {previewText && (
                      <p className="max-w-[36rem] text-[15px] leading-[1.6] text-ink-500">{previewText.value}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {/* Closing CTA: the question itself is the link to the first practice —
          plain centred text, no card around it. */}
      <div className="py-6 text-center text-xl leading-snug sm:text-2xl">
        <Link
          href="/practices/body-scan-1"
          className="font-semibold text-link decoration-clay-fill decoration-2 underline-offset-[6px] motion-safe:transition-colors hover:text-ink-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
        >
          {t('startHere.startPracticing')}
        </Link>
      </div>

      <p className="text-center text-sm text-ink-500">
        {t('startHere.learnMore')}{' '}
        <Link
          href="/learn"
          className="font-medium text-link hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {t('startHere.learnMoreCta')}
        </Link>
      </p>
    </Container>
  );
}
