import Link from 'next/link';
import { Card } from '@/components/ui';
import { CategoryBadge } from './CategoryBadge';
import { ModerationBadge, LockedBadge } from './ModerationBadge';
import { UserProfilePreview, type PreviewAuthor } from './UserProfilePreview';
import { formatDate } from '@/lib/format-date';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';
import type { Discussion, DiscussionCategory, ModerationStatus } from '@prisma/client';

export type DiscussionListItem = Discussion & {
  category: DiscussionCategory;
  status: ModerationStatus;
  author: PreviewAuthor;
  _count: { replies: number };
};

export function DiscussionCard({
  discussion,
  viewer,
  locale,
  t,
}: {
  discussion: DiscussionListItem;
  viewer: { id: string } | null;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  return (
    <Link href={`/community/discussions/${discussion.slug}`}>
      <Card className="flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={discussion.category} t={t} />
          {discussion.status !== 'PUBLISHED' && discussion.status !== 'REMOVED' && (
            <ModerationBadge status={discussion.status} t={t} />
          )}
          {discussion.locked && <LockedBadge t={t} />}
        </div>

        <h3 className="text-base font-semibold text-ink-900">{discussion.title}</h3>
        <p className="line-clamp-2 text-sm text-ink-500">{discussion.body}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <UserProfilePreview author={discussion.author} viewer={viewer} t={t} size="sm" className="flex-1" />
          <div className="flex shrink-0 flex-col items-end gap-0.5 text-xs text-ink-300">
            <span>{t('discussions.repliesCount', { count: discussion._count.replies })}</span>
            <span>{formatDate(discussion.lastActivityAt, locale)}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
