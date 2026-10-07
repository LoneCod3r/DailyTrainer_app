import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Container } from '@/components/ui';
import { HandbookSectionArticle } from '@/components/practices/HandbookSectionArticle';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getHandbookSectionBySlug, getStartHereSections, getStartHereSectionBySlug } from '@/modules/kuko-way/service';
import { handbookSectionHref } from '@/modules/kuko-way/handbook';

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

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-8">
      <HandbookSectionArticle
        section={section}
        locale={locale}
        backHref="/practices/start-here"
        backLabel={t('nav.startHere')}
        eyebrow={t('startHere.journeyLabel', { step: index + 1, total: sections.length })}
        prev={sections[index - 1]}
        next={sections[index + 1]}
        end={
          <Link href="/practices/body-scan-1" className="text-sm font-medium text-link hover:underline">
            {t('startHere.goToFirstPractice')} →
          </Link>
        }
      />
    </Container>
  );
}
