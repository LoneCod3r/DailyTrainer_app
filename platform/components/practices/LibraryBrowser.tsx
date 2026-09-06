'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from '@/lib/clsx';
import { Card, EmptyState } from '@/components/ui';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { PracticeCard } from './PracticeCard';
import { ProgramCard } from './ProgramCard';
import { localize, type Practice, type Program, type StartHereSection } from '@/modules/kuko-way/types';

type Category = 'all' | 'learn' | 'practices' | 'programs';

// Library's search + category browsing. Content is small and static (Day 2
// scope explicitly says "do not overbuild filtering") so this filters
// client-side over data already fetched server-side — no search API needed.
export function LibraryBrowser({
  practices,
  startHereSections,
  programs,
  initialQuery = '',
}: {
  practices: Practice[];
  startHereSections: StartHereSection[];
  programs: Program[];
  initialQuery?: string;
}) {
  const { locale, t } = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<Category>('all');

  const q = query.trim().toLowerCase();

  const filteredPractices = useMemo(
    () => practices.filter((p) => !q || localize(p.title, locale).value.toLowerCase().includes(q)),
    [practices, locale, q],
  );
  const filteredSections = useMemo(
    () => startHereSections.filter((s) => !q || localize(s.title, locale).value.toLowerCase().includes(q)),
    [startHereSections, locale, q],
  );
  const filteredPrograms = useMemo(
    () => programs.filter((p) => !q || localize(p.title, locale).value.toLowerCase().includes(q)),
    [programs, locale, q],
  );

  const totalResults = filteredPractices.length + filteredSections.length + filteredPrograms.length;
  const showLearn = category === 'all' || category === 'learn';
  const showPractices = category === 'all' || category === 'practices';
  const showPrograms = category === 'all' || category === 'programs';

  const categories: { id: Category; labelKey: 'library.categoryAll' | 'library.categoryLearn' | 'library.categoryPractices' | 'library.categoryPrograms' }[] = [
    { id: 'all', labelKey: 'library.categoryAll' },
    { id: 'learn', labelKey: 'library.categoryLearn' },
    { id: 'practices', labelKey: 'library.categoryPractices' },
    { id: 'programs', labelKey: 'library.categoryPrograms' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('library.searchPlaceholder')}
          className="w-full max-w-sm rounded-xl border border-sand-200 bg-surface px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-brand-600"
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={clsx(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                category === cat.id ? 'bg-brand-600 text-white' : 'bg-sand-100 text-ink-700 hover:bg-sand-200',
              )}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {query && <p className="text-sm text-ink-500">{t('library.resultsCount', { count: totalResults })}</p>}

      {query && totalResults === 0 ? (
        <EmptyState title={t('library.noResultsTitle')} description={t('library.noResultsDesc')} />
      ) : (
        <>
          {showLearn && filteredSections.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('library.categoryLearn')}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredSections.map((section) => (
                  <Link key={section.id} href={`/practices/start-here/${section.slug}`}>
                    <Card className="flex h-full flex-col gap-1 p-4 transition-shadow hover:shadow-soft">
                      <span className="text-sm font-medium text-ink-900">{localize(section.title, locale).value}</span>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {showPractices && filteredPractices.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('library.categoryPractices')}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPractices.map((practice) => (
                  <PracticeCard key={practice.id} practice={practice} locale={locale} t={t} />
                ))}
              </div>
            </section>
          )}

          {showPrograms && filteredPrograms.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('library.categoryPrograms')}</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {filteredPrograms.map((program) => (
                  <ProgramCard key={program.slug} program={program} locale={locale} t={t} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
