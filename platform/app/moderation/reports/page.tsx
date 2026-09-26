import { requireModeratorSession } from '@/lib/require-moderator-session';
import { listOpenReports } from '@/modules/moderation/moderation.service';
import { ReportsQueue } from '@/components/moderation/ReportsQueue';

export default async function ModerationReportsPage() {
  await requireModeratorSession();
  const reports = await listOpenReports();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Reports</h1>
        <p className="mt-1 text-sm text-ink-500">Discussions and replies members have flagged for review.</p>
      </div>
      <ReportsQueue initialReports={reports} />
    </div>
  );
}
