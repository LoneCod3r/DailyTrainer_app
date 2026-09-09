import { listModeratableMembers } from '@/modules/moderation/moderation.service';
import { MembersModerationTable } from '@/components/moderation/MembersModerationTable';
import { EmptyState } from '@/components/ui';
import { UsersIcon } from '@/components/layout/icons';

export default async function ModerationUsersPage() {
  const members = await listModeratableMembers(50);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Members</h1>
        <p className="mt-1 text-sm text-ink-500">
          Suspend or reactivate ordinary member accounts — the 50 most recently joined. Role changes and Moderator/Admin
          accounts are managed in the Admin panel.
        </p>
      </div>

      {members.length === 0 ? (
        <EmptyState icon={<UsersIcon width={28} height={28} />} title="No members yet" description="New sign-ups will show up here." />
      ) : (
        <MembersModerationTable initialRows={members} />
      )}
    </div>
  );
}
