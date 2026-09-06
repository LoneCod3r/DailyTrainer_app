import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Container, Card, Alert } from '@/components/ui';
import { PracticeCard } from '@/components/practices/PracticeCard';
import { MarkCompleteButton } from '@/components/practices/MarkCompleteButton';
import { Disclaimer } from '@/components/practices/Disclaimer';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { getAllPractices, getPracticeBySlug, getPracticeById, getChildPractices, getRelatedPractices } from '@/modules/kuko-way/service';
import { localize } from '@/modules/kuko-way/types';

export function generateStaticParams() {
  return getAllPractices().map((p) => ({ slug: p.slug }));
}

export default function PracticeDetailPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const t = getT(locale);
  const practice = getPracticeBySlug(params.slug);
  if (!practice) notFound();

  const title = localize(practice.title, locale);
  const parent = practice.parentId ? getPracticeById(practice.parentId) : undefined;
  const children = getChildPractices(practice);
  const related = getRelatedPractices(practice);

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-8">
      <Link
        href={parent ? `/practices/${parent.slug}` : '/practices/feel-better-now'}
        className="text-sm font-medium text-link hover:underline"
      >
        ← {parent ? localize(parent.title, locale).value : t('practiceDetail.backToFeelBetterNow')}
      </Link>

      <div>
        {parent && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-link">{t('practiceDetail.partOfOrganReset')}</p>
        )}
        <h1 className="text-2xl font-semibold text-ink-900">{title.value}</h1>
        {title.isFallback && <p className="mt-1 text-sm italic text-ink-300">{t('language.contentInBulgarian')}</p>}
      </div>

      {practice.safetyNote && (
        <Alert tone="warning" title={t('practiceDetail.safetyNote')}>
          {localize(practice.safetyNote, locale).value}
        </Alert>
      )}

      {practice.intro && practice.intro.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('practiceDetail.introduction')}</h2>
          {practice.intro.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed text-ink-700">
              {localize(p, locale).value}
            </p>
          ))}
        </section>
      )}

      {practice.benefits && practice.benefits.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('practiceDetail.benefits')}</h2>
          <ul className="flex flex-col gap-1.5">
            {practice.benefits.map((b, i) => (
              <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-ink-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {localize(b, locale).value}
              </li>
            ))}
          </ul>
        </section>
      )}

      {children.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('practiceDetail.includedResets')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <PracticeCard key={child.id} practice={child} locale={locale} t={t} />
            ))}
          </div>
        </section>
      )}

      {practice.instructions && practice.instructions.length > 0 && (
        <section id="instructions" className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('practiceDetail.instructions')}</h2>
          {practice.instructions.map((group, i) => (
            <div key={i} className="flex flex-col gap-2">
              {group.label && <h3 className="text-sm font-semibold text-ink-900">{localize(group.label, locale).value}</h3>}
              <ol className="flex flex-col gap-2">
                {group.steps.map((step, j) => (
                  <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-ink-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sand-100 text-xs font-semibold text-ink-500">
                      {j + 1}
                    </span>
                    {localize(step, locale).value}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </section>
      )}

      {!practice.instructions && children.length === 0 && (
        <Card className="p-5 text-sm text-ink-500">{t('practiceDetail.stepsComingSoon')}</Card>
      )}

      {practice.instructions && (
        <div>
          <MarkCompleteButton practiceSlug={practice.slug} />
        </div>
      )}

      {related.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-sand-200 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('practiceDetail.relatedPractices')}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {related.map((p) => (
              <PracticeCard key={p.id} practice={p} locale={locale} t={t} />
            ))}
          </div>
        </section>
      )}

      <Disclaimer t={t} />
    </Container>
  );
}
