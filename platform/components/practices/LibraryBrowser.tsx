'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { clsx } from '@/lib/clsx';
import { Card, EmptyState } from '@/components/ui';
import { useLocale } from '@/lib/i18n/LocaleProvider';
import { localize, type Practice, type Program, type StartHereSection } from '@/modules/kuko-way/types';

type Category = 'all' | 'learn' | 'practices' | 'programs';

function stepCountOf(practice: Practice): number | undefined {
  return practice.instructions?.reduce((n, group) => n + group.steps.length, 0);
}

// Library's search + category browsing. Content is small and static (Day 2
// scope explicitly says "do not overbuild filtering") so this filters
// client-side over data already fetched server-side — no search API needed.
//
// Redesigned from a repetitive card-grid browser into an editorial "archive
// index": a numbered list for Learn, a single featured practice + compact
// scan list for Practices, and a quiet list for Programs — kept lighter than
// the entry point / ProgramTrail zones on the main /practices page. Search
// deliberately stays a plain filtered list rather than the editorial
// treatment, since search is a utility flow, not a browsing one.
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

  // The featured practice is only shown while browsing (not while searching,
  // where a plain filtered list is more useful than an editorial treatment).
  const featured = !q ? filteredPractices[0] : undefined;
  const featuredSummary = featured?.intro?.[0] ? localize(featured.intro[0], locale).value : undefined;
  const featuredSteps = featured ? stepCountOf(featured) : undefined;

  return (
    <div className="flex flex-col gap-10 sm:gap-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="flex w-max gap-6 border-b border-sand-200 sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                aria-pressed={category === cat.id}
                className={clsx(
                  'shrink-0 border-b-2 pb-2.5 text-sm font-medium uppercase tracking-wide transition-colors',
                  category === cat.id ? 'border-link text-link' : 'border-transparent text-ink-400 hover:text-ink-700',
                )}
              >
                {t(cat.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('library.searchPlaceholder')}
          className="w-full max-w-sm border-b border-sand-200 bg-transparent px-1 py-2 text-sm text-ink-900 placeholder:text-ink-300 focus:border-link focus:outline-none"
        />
      </div>

      {query && <p className="text-sm text-ink-500">{t('library.resultsCount', { count: totalResults })}</p>}

      {query && totalResults === 0 ? (
        <EmptyState title={t('library.noResultsTitle')} description={t('library.noResultsDesc')} />
      ) : (
        <div className="flex flex-col gap-12 sm:gap-16">
          {showLearn && filteredSections.length > 0 && (
            <section className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-link sm:text-sm">
                  {t('library.categoryLearn')}
                </h2>
                <p className="font-serif text-xl text-ink-900 sm:text-2xl">{t('startHere.subtitle')}</p>
              </div>
              <ol className="flex list-none flex-col divide-y divide-sand-100">
                {filteredSections.map((section, index) => (
                  <li key={section.id}>
                    <Link
                      href={`/practices/start-here/${section.slug}`}
                      className="group flex items-center gap-4 py-3.5 sm:py-4"
                    >
                      <span className="w-8 shrink-0 font-serif text-base text-ink-300 sm:w-10 sm:text-lg">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 text-sm text-ink-900 group-hover:text-link sm:text-base">
                        {localize(section.title, locale).value}
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-link opacity-70 transition-transform motion-safe:group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {showPractices && filteredPractices.length > 0 && (
            <section className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-link sm:text-sm">
                  {t('library.categoryPractices')}
                </h2>
                <p className="font-serif text-xl text-ink-900 sm:text-2xl">{t('practices.libraryDesc')}</p>
              </div>

              {featured && (
                <Link href={`/practices/${featured.slug}`} className="group block">
                  <Card className="flex flex-col gap-4 p-6 transition-shadow hover:shadow-soft sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8">
                    <div className="flex min-w-0 flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-link">
                        {t('library.categoryPractices')}
                      </span>
                      <h3 className="font-serif text-xl text-ink-900 sm:text-2xl">
                        {localize(featured.title, locale).value}
                      </h3>
                      {featuredSummary && <p className="max-w-lg text-sm text-ink-500">{featuredSummary}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-4">
                      {featuredSteps ? (
                        <span className="text-xs text-ink-400">
                          {featuredSteps} {t('common.steps')}
                        </span>
                      ) : null}
                      <span
                        aria-hidden="true"
                        className="text-lg font-medium text-link motion-safe:transition-transform motion-safe:group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </div>
                  </Card>
                </Link>
              )}

              <div className="flex flex-col gap-3">
                {!q && (
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {t('feelBetterNow.allPractices')}
                  </p>
                )}
                <ul className="flex list-none flex-col divide-y divide-sand-100">
                  {filteredPractices.map((practice) => {
                    const steps = stepCountOf(practice);
                    return (
                      <li key={practice.id}>
                        <Link
                          href={`/practices/${practice.slug}`}
                          className="group flex items-center justify-between gap-4 py-3"
                        >
                          <span className="min-w-0 text-sm text-ink-900 group-hover:text-link sm:text-base">
                            {localize(practice.title, locale).value}
                          </span>
                          <span className="flex shrink-0 items-center gap-3 text-xs text-ink-400">
                            {steps ? (
                              <span>
                                {steps} {t('common.steps')}
                              </span>
                            ) : null}
                            <span
                              aria-hidden="true"
                              className="text-link transition-transform motion-safe:group-hover:translate-x-1"
                            >
                              →
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          )}

          {showPrograms && filteredPrograms.length > 0 && (
            <section className="flex flex-col gap-5">
              <div className="flex flex-col gap-1">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-link sm:text-sm">
                  {t('library.categoryPrograms')}
                </h2>
                <p className="font-serif text-xl text-ink-900 sm:text-2xl">{t('practices.programsDesc')}</p>
              </div>
              <ul className="flex list-none flex-col divide-y divide-sand-100">
                {filteredPrograms.map((program) => (
                  <li key={program.slug}>
                    <Link
                      href={`/practices/programs/${program.slug}`}
                      className="group flex items-center justify-between gap-4 py-3.5 sm:py-4"
                    >
                      <span className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="shrink-0 text-sm font-semibold text-ink-900 group-hover:text-link sm:text-base">
                          {program.length} {t('programs.daysUnit')}
                        </span>
                        <span className="text-sm text-ink-500">{localize(program.description, locale).value}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-link transition-transform motion-safe:group-hover:translate-x-1"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
