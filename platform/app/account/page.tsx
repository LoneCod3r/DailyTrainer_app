import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProfileByUserId } from '@/modules/profiles/profiles.service';
import { getActiveSubscriptionForUser } from '@/modules/membership/membership.service';
import { ProfileForm } from '@/components/account/ProfileForm';
import { MembershipStatus } from '@/components/account/MembershipStatus';
import { Container, Badge } from '@/components/ui';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/account');

  const [profile, subscription] = await Promise.all([
    getProfileByUserId(session.user.id),
    getActiveSubscriptionForUser(session.user.id),
  ]);

  return (
    <Container className="flex flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">My account</h1>
        <p className="mt-1 text-sm text-ink-500">
          {session.user.email} · <Badge tone="brand">{session.user.role}</Badge>
        </p>
      </div>

      <MembershipStatus subscription={subscription} />

      <ProfileForm
        initialProfile={{
          bio: profile?.bio ?? null,
          avatarUrl: profile?.avatarUrl ?? null,
          interests: profile?.interests ?? [],
          visibility: profile?.visibility ?? 'MEMBERS',
        }}
      />
    </Container>
  );
}
