import type { Metadata } from 'next';
import { Container, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { FeaturedArticle } from '@/components/blog/FeaturedArticle';
import { ArticleCard } from '@/components/blog/ArticleCard';
import { BlogCategoryFilter } from '@/components/blog/BlogCategoryFilter';
import { listPublishedContent, getFeaturedContent, listContentCategories } from '@/modules/content/content.service';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export function generateMetadata(): Metadata {
  const t = getT(getLocale());
  return { title: t('blog.pageTitle'), description: t('blog.pageSubtitle') };
}

export default async function BlogPage({ searchParams }: { searchParams: { category?: string } }) {
  const locale = getLocale();
  const t = getT(locale);
  const category = searchParams.category;

  const [featured, latest, categories] = await Promise.all([
    category ? null : getFeaturedContent(),
    listPublishedContent({ type: 'ARTICLE', category, limit: 20 }),
    listContentCategories('ARTICLE'),
  ]);

  const latestExcludingFeatured = latest.filter((item) => item.id !== featured?.id);

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader title={t('blog.pageTitle')} description={t('blog.pageSubtitle')} />

      <BlogCategoryFilter categories={categories} active={category} t={t} />

      {featured && <FeaturedArticle article={featured} locale={locale} t={t} />}

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-ink-900">{t('blog.latestTitle')}</h2>
        {latestExcludingFeatured.length === 0 ? (
          <EmptyState title={t('blog.emptyTitle')} description={t('blog.emptyDesc')} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {latestExcludingFeatured.map((article) => (
              <ArticleCard key={article.id} article={article} locale={locale} t={t} />
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
