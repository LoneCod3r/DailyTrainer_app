import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardTitle, Badge, EmptyState } from '@/components/ui';
import { FlagIcon, DiscussionsIcon, HistoryIcon } from '@/components/layout/icons';
import { getModerationOverview, listOpenReports, listReportHistory } from '@/modules/moderation/moderation.service';
import { REASON_LABEL } from '@/components/moderation/labels';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function MetricCard({ label, value, icon, hint }: { label: string; value: number; icon: React.ReactNode; hint?: string }) {
  return (
    <Card>
      <CardContent className="flex items-start gap-4">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-link">
          {icon}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-sm text-ink-500">{label}</span>
          <span className="text-2xl font-semibold text-ink-900">{value}</span>
          {hint && <span className="text-xs text-ink-300">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ModerationDashboardPage() {
  const session = await getServerSession(authOptions);
  const [overview, openReports, recentHistory] = await Promise.all([
    getModerationOverview(),
    listOpenReports(),
    listReportHistory(5),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">
              {greeting()}
              {session?.user.name ? `, ${session.user.name}` : ''}
            </h1>
            <p className="mt-1 text-sm text-ink-500">Here&apos;s what needs your attention in the community today.</p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-lg border border-sand-200 px-3 py-1.5 text-sm font-medium text-ink-700">
            {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Open reports" value={overview.openReports} hint="Awaiting review" icon={<FlagIcon width={20} height={20} />} />
        <MetricCard
          label="Pending content"
          value={overview.pendingContent}
          hint="Discussions & replies"
          icon={<DiscussionsIcon width={20} height={20} />}
        />
        <MetricCard
          label="Resolved (7 days)"
          value={overview.resolvedLast7Days}
          hint="Reports you've closed"
          icon={<HistoryIcon width={20} height={20} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex items-center justify-between gap-3 pb-0">
            <CardTitle>Moderation queue</CardTitle>
            <Link href="/moderation/reports" className="text-sm font-medium text-link hover:underline">
              View all
            </Link>
          </CardContent>
          <CardContent className="pt-4">
            {openReports.length === 0 ? (
              <EmptyState
                title="Your moderation queue is clear"
                description="No reports are waiting for review. New reports from members will show up here."
              />
            ) : (
              <div className="flex flex-col divide-y divide-sand-100">
                {openReports.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">
                        {r.target.kind === 'DISCUSSION'
                          ? r.target.title
                          : r.target.kind === 'DISCUSSION_REPLY'
                            ? r.target.body.slice(0, 80)
                            : 'Content no longer available'}
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        Reported by {r.reporter.name ?? r.reporter.email} · {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge tone="warning">{REASON_LABEL[r.reason]}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-3 pb-0">
            <CardTitle>Recent activity</CardTitle>
            <Link href="/moderation/history" className="text-sm font-medium text-link hover:underline">
              View all
            </Link>
          </CardContent>
          <CardContent className="pt-4">
            {recentHistory.length === 0 ? (
              <EmptyState title="No moderation activity yet" description="Resolved reports will appear here." />
            ) : (
              <div className="flex flex-col divide-y divide-sand-100">
                {recentHistory.map((r) => (
                  <div key={r.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                    <p className="truncate text-sm font-medium text-ink-900">
                      {r.target.kind === 'DISCUSSION' ? r.target.title : r.target.kind === 'DISCUSSION_REPLY' ? r.target.body.slice(0, 60) : 'Content removed'}
                    </p>
                    <p className="text-xs text-ink-500">
                      {r.status === 'RESOLVED' ? 'Resolved' : 'Dismissed'} by {r.handledBy?.name ?? r.handledBy?.email ?? '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
