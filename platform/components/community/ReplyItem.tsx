import { ModerationBadge } from './ModerationBadge';
import { UserProfilePreview, type PreviewAuthor } from './UserProfilePreview';
import { formatDateTime } from '@/lib/format-date';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';
import type { ModerationStatus } from '@prisma/client';

export function ReplyItem({
  reply,
  viewer,
  locale,
  t,
}: {
  reply: { id: string; body: string; createdAt: Date | string; status: ModerationStatus; author: PreviewAuthor };
  viewer: { id: string } | null;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  return (
    <div className="flex flex-col gap-2 border-l-2 border-sand-200 py-3 pl-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <UserProfilePreview author={reply.author} viewer={viewer} t={t} size="sm" />
        <div className="flex items-center gap-2">
          {reply.status !== 'PUBLISHED' && reply.status !== 'REMOVED' && <ModerationBadge status={reply.status} t={t} />}
          <span className="text-xs text-ink-300">{formatDateTime(reply.createdAt, locale)}</span>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm text-ink-700">{reply.body}</p>
    </div>
  );
}
