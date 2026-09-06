import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, Button, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { DiscussionCard } from '@/components/community/DiscussionCard';
import { CategoryFilter } from '@/components/community/CategoryFilter';
import { listDiscussions, DISCUSSION_CATEGORIES } from '@/modules/discussions/discussions.service';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import type { DiscussionCategory } from '@prisma/client';

function isDiscussionCategory(value: string | undefined): value is DiscussionCategory {
  return Boolean(value) && (DISCUSSION_CATEGORIES as string[]).includes(value as string);
}

export default async function DiscussionsPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const locale = getLocale();
  const t = getT(locale);
  const session = await getServerSession(authOptions);
  const viewer = session?.user ? { id: session.user.id, role: session.user.role } : null;

  const category = isDiscussionCategory(searchParams.category) ? searchParams.category : undefined;
  const discussions = await listDiscussions({ category, viewer });

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow={t('nav.community')}
        title={t('discussions.pageTitle')}
        description={t('discussions.pageSubtitle')}
        action={
          <Link href="/community/discussions/new">
            <Button>{t('discussions.newDiscussion')}</Button>
          </Link>
        }
      />

      <CategoryFilter active={category} t={t} />

      {discussions.length === 0 ? (
        <EmptyState title={t('discussions.emptyTitle')} description={t('discussions.emptyDesc')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {discussions.map((discussion) => (
            <DiscussionCard key={discussion.id} discussion={discussion} viewer={viewer} locale={locale} t={t} />
          ))}
        </div>
      )}
    </Container>
  );
}
