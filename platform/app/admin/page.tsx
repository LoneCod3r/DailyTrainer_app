import { Card, CardContent } from '@/components/ui';
import { getUserStats } from '@/modules/users/users.service';

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1">
        <span className="text-sm text-ink-500">{label}</span>
        <span className="text-2xl font-semibold text-ink-900">{value}</span>
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getUserStats();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Dashboard</h1>
        <p className="text-sm text-ink-500">Basic system statistics for the Foundation Phase.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.totalUsers} />
        <StatCard label="New (30 days)" value={stats.newLast30Days} />
        <StatCard label="Admins" value={stats.byRole.ADMIN ?? 0} />
        <StatCard label="Moderators" value={stats.byRole.MODERATOR ?? 0} />
      </div>

      <Card className="border-dashed bg-sand-50/50">
        <CardContent>
          <p className="text-sm text-ink-500">
            Future modules (Content, Courses, Discussions, Meetings, Membership, Payments) will add their own
            statistics and admin sections here as they are built — no restructuring required.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
