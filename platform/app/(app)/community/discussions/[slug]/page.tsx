import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Container, Card, CardContent, Alert } from '@/components/ui';
import { CategoryBadge } from '@/components/community/CategoryBadge';
import { ModerationBadge, LockedBadge } from '@/components/community/ModerationBadge';
import { UserProfilePreview } from '@/components/community/UserProfilePreview';
import { ReplyItem } from '@/components/community/ReplyItem';
import { ReplyForm } from '@/components/community/ReplyForm';
import { getDiscussionBySlug } from '@/modules/discussions/discussions.service';
import { formatDateTime } from '@/lib/format-date';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export default async function DiscussionThreadPage({ params }: { params: { slug: string } }) {
  const locale = getLocale();
  const t = getT(locale);
  const session = await getServerSession(authOptions);
  const viewer = session?.user ? { id: session.user.id, role: session.user.role } : null;

  const discussion = await getDiscussionBySlug(params.slug, viewer);
  if (!discussion) notFound();

  return (
    <Container className="flex max-w-3xl flex-col gap-6 py-8">
      <Link href="/community/discussions" className="text-sm font-medium text-link hover:underline">
        {t('discussions.backToDiscussions')}
      </Link>

      {discussion.status !== 'PUBLISHED' && (
        <Alert tone={discussion.status === 'PENDING' ? 'warning' : 'danger'}>
          {discussion.status === 'PENDING' ? t('discussions.moderationPendingDesc') : t('discussions.moderationHiddenDesc')}
        </Alert>
      )}

      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={discussion.category} t={t} />
            {discussion.status !== 'PUBLISHED' && discussion.status !== 'REMOVED' && (
              <ModerationBadge status={discussion.status} t={t} />
            )}
            {discussion.locked && <LockedBadge t={t} />}
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-300">{t('discussions.originalPost')}</span>
          </div>

          <h1 className="text-2xl font-semibold text-ink-900">{discussion.title}</h1>

          <UserProfilePreview author={discussion.author} viewer={viewer} t={t} />
          <p className="text-xs text-ink-300">{t('discussions.posted', { date: formatDateTime(discussion.createdAt, locale) })}</p>

          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-700">{discussion.body}</p>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-ink-900">{t('discussions.repliesHeading')}</h2>

        {discussion.replies.length === 0 ? (
          <p className="text-sm text-ink-500">{t('discussions.noRepliesTitle')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {discussion.replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} viewer={viewer} locale={locale} t={t} />
            ))}
          </div>
        )}

        {discussion.locked ? (
          <Alert tone="warning" title={t('discussions.lockedTitle')}>
            {t('discussions.lockedDesc')}
          </Alert>
        ) : session?.user ? (
          <ReplyForm discussionSlug={discussion.slug} />
        ) : (
          <Alert tone="info">
            <Link href={`/login?callbackUrl=/community/discussions/${discussion.slug}`} className="font-medium underline">
              {t('discussions.replyLoginPrompt')}
            </Link>
          </Alert>
        )}
      </section>
    </Container>
  );
}
