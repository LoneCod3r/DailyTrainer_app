import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { Container } from '@/components/ui';
import { HandbookSectionArticle } from '@/components/practices/HandbookSectionArticle';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getHandbookSectionBySlug, getLearnSectionBySlug, getLearnSections } from '@/modules/kuko-way/service';
import { handbookSectionHref } from '@/modules/kuko-way/handbook';
import { localize } from '@/modules/kuko-way/types';

export function generateStaticParams() {
  return getLearnSections().map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const section = getLearnSectionBySlug(params.slug);
  return section ? { title: localize(section.title, getLocale()).value } : {};
}

// A Learn chapter (understanding / reference) from the beginner's handbook.
// A Start Here chapter requested here redirects to its single home.
export default function LearnSectionPage({ params }: { params: { slug: string } }) {
  const section = getLearnSectionBySlug(params.slug);
  if (!section) {
    const other = getHandbookSectionBySlug(params.slug);
    if (other) permanentRedirect(handbookSectionHref(other));
    notFound();
  }

  const locale = getLocale();
  const t = getT(locale);
  const sections = getLearnSections();
  const index = sections.findIndex((s) => s.id === section.id);

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-8">
      <HandbookSectionArticle
        section={section}
        locale={locale}
        backHref="/learn"
        backLabel={t('learn.pageTitle')}
        eyebrow={t('learn.bodyTitle')}
        prev={sections[index - 1]}
        next={sections[index + 1]}
        end={
          <Link href="/practices" className="text-sm font-medium text-link hover:underline">
            {t('practiceSession.nextQuestion')} →
          </Link>
        }
      />
    </Container>
  );
}
