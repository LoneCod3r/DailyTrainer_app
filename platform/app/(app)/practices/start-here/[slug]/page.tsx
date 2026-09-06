import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Card } from '@/components/ui';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getStartHereSections, getStartHereSectionBySlug } from '@/modules/kuko-way/service';
import { localize } from '@/modules/kuko-way/types';

export function generateStaticParams() {
  return getStartHereSections().map((s) => ({ slug: s.slug }));
}

export default function StartHereSectionPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const t = getT(locale);
  const section = getStartHereSectionBySlug(params.slug);
  if (!section) notFound();

  const sections = getStartHereSections();
  const index = sections.findIndex((s) => s.id === section.id);
  const prev = index > 0 ? sections[index - 1] : undefined;
  const next = index < sections.length - 1 ? sections[index + 1] : undefined;

  const title = localize(section.title, locale);

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-8">
      <Link href="/practices/start-here" className="text-sm font-medium text-link hover:underline">
        ← {t('nav.startHere')}
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-link">
          {t('startHere.journeyLabel', { step: index + 1, total: sections.length })}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-ink-900">{title.value}</h1>
      </div>

      <article className="flex flex-col gap-4">
        {section.paragraphs?.map((p, i) => {
          const text = localize(p, locale);
          return (
            <p key={i} className="text-[15px] leading-relaxed text-ink-700">
              {text.value}
            </p>
          );
        })}

        {section.subsections?.map((sub, i) => {
          const subTitle = localize(sub.title, locale);
          return (
            <div key={i} className="flex flex-col gap-2 border-t border-sand-200 pt-4 first:border-t-0 first:pt-0">
              <h2 className="text-base font-semibold text-ink-900">{subTitle.value}</h2>
              {sub.paragraphs.map((p, j) => {
                const text = localize(p, locale);
                return (
                  <p key={j} className="text-[15px] leading-relaxed text-ink-700">
                    {text.value}
                  </p>
                );
              })}
            </div>
          );
        })}
      </article>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        {prev ? (
          <Link href={`/practices/start-here/${prev.slug}`} className="text-sm text-ink-500 hover:text-ink-900">
            ← {localize(prev.title, locale).value}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/practices/start-here/${next.slug}`} className="text-sm font-medium text-link hover:underline">
            {localize(next.title, locale).value} →
          </Link>
        ) : (
          <Link href="/practices/body-scan-1" className="text-sm font-medium text-link hover:underline">
            {t('startHere.goToFirstPractice')} →
          </Link>
        )}
      </Card>
    </Container>
  );
}
