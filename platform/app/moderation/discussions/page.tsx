import { requireModeratorSession } from '@/lib/require-moderator-session';
import { listDiscussionsForModeration } from '@/modules/moderation/moderation.service';
import { DiscussionsModerationTable } from '@/components/moderation/DiscussionsModerationTable';
import { EmptyState } from '@/components/ui';
import { DiscussionsIcon } from '@/components/layout/icons';

export default async function ModerationDiscussionsPage() {
  await requireModeratorSession();
  const discussions = await listDiscussionsForModeration(50);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Discussions</h1>
        <p className="mt-1 text-sm text-ink-500">Hide, remove, restore, or lock any discussion — the 50 most recently active.</p>
      </div>

      {discussions.length === 0 ? (
        <EmptyState
          icon={<DiscussionsIcon width={28} height={28} />}
          title="No discussions yet"
          description="New discussions posted by members will show up here."
        />
      ) : (
        <DiscussionsModerationTable initialRows={discussions} />
      )}
    </div>
  );
}
