import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { FreeVideoCard } from '@/components/practices/FreeVideoCard';
import { listPublishedContent } from '@/modules/content/content.service';
import { getFreeVideos, getLearnSections } from '@/modules/kuko-way/service';
import { localize } from '@/modules/kuko-way/types';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export function generateMetadata(): Metadata {
  const t = getT(getLocale());
  return { title: t('learn.pageTitle'), description: t('learn.pageSubtitle') };
}

// Learn hub (KUKO WAY concept §12) — educational / reference content: the
// handbook's background chapters on the body and fascia (owned by Learn, not
// repeated in Start Here — see modules/kuko-way/handbook.ts), published
// articles and the YouTube videos ("YouTube → KUKO WAY → Practice"). The
// concept's topic taxonomy (Fascia, Nervous system, Breath, Hydration,
// Movement, Awareness) has no content behind it yet, so it is not rendered
// as empty shelves — it arrives with the content.
export default async function LearnPage() {
  const locale = getLocale();
  const t = getT(locale);
  const [articles, sections, videos] = await Promise.all([
    listPublishedContent({ type: 'ARTICLE', limit: 6 }),
    Promise.resolve(getLearnSections()),
    Promise.resolve(getFreeVideos()),
  ]);

  return (
    <Container className="flex flex-col gap-12 py-8 sm:gap-16">
      <PageHeader title={t('learn.pageTitle')} description={t('learn.pageSubtitle')} />

      <section className="flex flex-col gap-4" data-testid="learn-handbook">
        <h2 className="font-serif text-2xl text-ink-900 sm:text-3xl">{t('learn.bodyTitle')}</h2>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => (
            <li key={section.id}>
              <Link
                href={`/learn/${section.slug}`}
                className="flex h-full items-start gap-3 rounded-2xl border border-sand-200 bg-surface p-4 transition-shadow hover:shadow-soft"
              >
                <span className="mt-0.5 text-sm font-semibold text-clay">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-base font-medium text-ink-900">{localize(section.title, locale).value}</span>
              </Link>
            </li>
          ))}
        </ol>
        <p className="text-sm text-ink-500">
          {t('learn.newHere')}{' '}
          <Link href="/practices/start-here" className="font-medium text-link hover:underline">
            {t('nav.startHere')} →
          </Link>
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-serif text-2xl text-ink-900 sm:text-3xl">{t('learn.articlesTitle')}</h2>
          <Link href="/blog" className="shrink-0 text-sm font-medium text-link hover:underline">
            {t('learn.viewAll')} →
          </Link>
        </div>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} t={t} />
            ))}
          </div>
        ) : (
          <EmptyState title={t('blog.emptyTitle')} description={t('blog.emptyDesc')} />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-serif text-2xl text-ink-900 sm:text-3xl">{t('learn.videosTitle')}</h2>
          <Link href="/practices/free-videos" className="shrink-0 text-sm font-medium text-link hover:underline">
            {t('learn.viewAll')} →
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <FreeVideoCard key={video.id} video={video} locale={locale} t={t} />
          ))}
        </div>
      </section>
    </Container>
  );
}
