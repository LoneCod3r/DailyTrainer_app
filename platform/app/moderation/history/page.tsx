import { requireModeratorSession } from '@/lib/require-moderator-session';
import Link from 'next/link';
import { Badge, Card, CardContent, EmptyState } from '@/components/ui';
import { HistoryIcon } from '@/components/layout/icons';
import { listReportHistory } from '@/modules/moderation/moderation.service';
import { REASON_LABEL, RESOLUTION_LABEL } from '@/components/moderation/labels';

export default async function ModerationHistoryPage() {
  await requireModeratorSession();
  const reports = await listReportHistory(50);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Moderation history</h1>
        <p className="mt-1 text-sm text-ink-500">The last 50 reports your team has resolved or dismissed.</p>
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon width={28} height={28} />}
          title="No moderation activity yet"
          description="Resolved and dismissed reports will be recorded here."
        />
      ) : (
        <Card>
          <CardContent className="flex flex-col divide-y divide-sand-100 p-0">
            {reports.map((r) => (
              <div key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={r.status === 'RESOLVED' ? 'success' : 'neutral'}>
                      {r.status === 'RESOLVED' ? 'Resolved' : 'Dismissed'}
                    </Badge>
                    <Badge tone="warning">{REASON_LABEL[r.reason]}</Badge>
                  </div>
                  <p className="mt-1 truncate text-sm text-ink-900">
                    {r.target.kind === 'DISCUSSION' ? (
                      <Link href={`/community/discussions/${r.target.slug}`} className="hover:underline">
                        {r.target.title}
                      </Link>
                    ) : r.target.kind === 'DISCUSSION_REPLY' ? (
                      <Link href={`/community/discussions/${r.target.discussionSlug}`} className="hover:underline">
                        {r.target.body.slice(0, 80)}
                      </Link>
                    ) : (
                      'Content no longer available'
                    )}
                  </p>
                  {r.resolutionNote && <p className="mt-1 text-xs text-ink-500">{r.resolutionNote}</p>}
                </div>
                <div className="shrink-0 text-right text-xs text-ink-500">
                  <p>{r.resolution ? RESOLUTION_LABEL[r.resolution] : '—'}</p>
                  <p>
                    {r.handledBy?.name ?? r.handledBy?.email ?? '—'} · {r.handledAt ? new Date(r.handledAt).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
