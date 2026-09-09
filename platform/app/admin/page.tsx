import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Card, CardContent, CardTitle, Badge, EmptyState } from '@/components/ui';
import { UsersIcon, MembershipIcon, ShieldIcon, TrendUpIcon } from '@/components/layout/icons';
import { getUserStats, listUsers } from '@/modules/users/users.service';
import { getMembershipOverview } from '@/modules/membership/membership.service';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source.charAt(0).toUpperCase();
}

function MetricCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  hint?: string;
}) {
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

const statusTone = { ACTIVE: 'success', INACTIVE: 'neutral', SUSPENDED: 'danger' } as const;

// A restrained, single-hue progress scale — darkest for the top plan,
// lighter for the rest, sand for the "no plan" bucket — instead of a
// different accent color per row.
const BAR_SHADE = ['bg-brand-600', 'bg-brand-400', 'bg-brand-300'];

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const [stats, { users: recentUsers }, membership] = await Promise.all([
    getUserStats(),
    listUsers({ page: 1, pageSize: 5 }),
    getMembershipOverview(),
  ]);

  const activeMembers = stats.byStatus.ACTIVE ?? 0;
  const newUsersShare = stats.totalUsers > 0 ? Math.round((stats.newLast30Days / stats.totalUsers) * 100) : 0;

  const membershipRows = [
    ...membership.plans.map((plan) => ({ id: plan.id, name: plan.name, description: plan.description, members: plan.members })),
    { id: 'free', name: 'No plan', description: 'Not currently subscribed', members: membership.freeMembers },
  ];

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">
              {greeting()}
              {session?.user.name ? `, ${session.user.name}` : ''}
            </h1>
            <p className="mt-1 text-sm text-ink-500">Here&apos;s what&apos;s happening with your platform today.</p>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-lg border border-sand-200 px-3 py-1.5 text-sm font-medium text-ink-700">
            {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Total users" value={stats.totalUsers} hint="All time" icon={<UsersIcon width={20} height={20} />} />
        <MetricCard
          label="New (30 days)"
          value={stats.newLast30Days}
          hint={stats.totalUsers > 0 ? `${newUsersShare}% of all users` : undefined}
          icon={<TrendUpIcon width={20} height={20} />}
        />
        <MetricCard
          label="Active members"
          value={activeMembers}
          hint="Currently active accounts"
          icon={<MembershipIcon width={20} height={20} />}
        />
        <MetricCard
          label="Admins & moderators"
          value={(stats.byRole.ADMIN ?? 0) + (stats.byRole.MODERATOR ?? 0)}
          hint={`${stats.byRole.ADMIN ?? 0} admin · ${stats.byRole.MODERATOR ?? 0} moderator`}
          icon={<ShieldIcon width={20} height={20} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex items-center justify-between gap-3 pb-0">
            <CardTitle>Recent users</CardTitle>
            <Link href="/admin/users" className="text-sm font-medium text-link hover:underline">
              View all
            </Link>
          </CardContent>
          <CardContent className="pt-4">
            {recentUsers.length === 0 ? (
              <EmptyState title="No users yet" description="New sign-ups will show up here." />
            ) : (
              <div className="flex flex-col divide-y divide-sand-100">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-tint text-sm font-semibold text-link">
                      {initials(u.name, u.email)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{u.name ?? u.email}</p>
                      <p className="truncate text-xs text-ink-500">{u.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={statusTone[u.status]}>{u.status}</Badge>
                      <span className="hidden text-xs text-ink-300 sm:inline">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between gap-3 pb-0">
            <CardTitle>Membership overview</CardTitle>
            <Link href="/admin/membership" className="text-sm font-medium text-link hover:underline">
              Manage
            </Link>
          </CardContent>
          <CardContent className="pt-4">
            {membership.plans.length === 0 ? (
              <EmptyState title="No plans yet" description="Create a membership plan to get started." />
            ) : (
              <div className="flex flex-col divide-y divide-sand-100">
                {membershipRows.map((row, i) => {
                  const pct = membership.totalUsers > 0 ? (row.members / membership.totalUsers) * 100 : 0;
                  return (
                    <div key={row.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-900">{row.name}</p>
                          {row.description && <p className="truncate text-xs text-ink-500">{row.description}</p>}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-medium text-ink-900">
                            {row.members} {row.members === 1 ? 'member' : 'members'}
                          </p>
                          <p className="text-xs text-ink-300">{pct.toFixed(1)}% of total</p>
                        </div>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-sand-100">
                        <div
                          className={`h-full rounded-full ${BAR_SHADE[Math.min(i, BAR_SHADE.length - 1)]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed bg-sand-50/50">
        <CardContent>
          <p className="text-sm text-ink-500">
            Revenue reporting and further modules (Content, Courses, Discussions, Meetings, Payments) will add their
            own statistics and admin sections here as they are built — no restructuring required.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
