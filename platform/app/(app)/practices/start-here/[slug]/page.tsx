import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Container } from '@/components/ui';
import { HandbookSectionArticle } from '@/components/practices/HandbookSectionArticle';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getHandbookSectionBySlug, getStartHereSections, getStartHereSectionBySlug } from '@/modules/kuko-way/service';
import { handbookSectionHref, START_HERE_PHASES } from '@/modules/kuko-way/handbook';

export function generateStaticParams() {
  return getStartHereSections().map((s) => ({ slug: s.slug }));
}

// A Start Here chapter (orientation / first steps). Chapters that now live in
// Learn (modules/kuko-way/handbook.ts) permanently redirect to their single
// home there, so older links and bookmarks keep working.
export default function StartHereSectionPage({ params }: { params: { slug: string } }) {
  const section = getStartHereSectionBySlug(params.slug);
  if (!section) {
    const moved = getHandbookSectionBySlug(params.slug);
    if (moved) permanentRedirect(handbookSectionHref(moved));
    notFound();
  }

  const locale = getLocale();
  const t = getT(locale);
  const sections = getStartHereSections();
  const index = sections.findIndex((s) => s.id === section.id);
  // "Step 4 of 6 · How to practise" — which part of the journey
  // this chapter belongs to.
  const phase = START_HERE_PHASES.find((p) => p.sectionIds.includes(section.id));
  const step = t('startHere.journeyLabel', { step: index + 1, total: sections.length });
  // The last chapter ("What to Expect") closes the sequence: no "next" link —
  // instead a small centred way back to the Start Here index.
  const isLast = index === sections.length - 1;

  return (
    <Container className="py-8 sm:py-12">
      <HandbookSectionArticle
        section={section}
        locale={locale}
        backHref="/practices/start-here"
        backLabel={t('nav.startHere')}
        eyebrow={phase ? `${step} · ${t(phase.labelKey)}` : step}
        prev={sections[index - 1]}
        next={sections[index + 1]}
      />
      {isLast && (
        <div className="mx-auto mt-12 flex max-w-xl flex-col items-center gap-4 text-center sm:mt-14">
          <Link
            href="/practices/start-here"
            className="text-sm font-medium text-link hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
          >
            {t('startHere.exploreKukoWay')}
          </Link>
        </div>
      )}
    </Container>
  );
}
