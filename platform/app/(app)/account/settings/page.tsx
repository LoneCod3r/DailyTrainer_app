import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProfileByUserId } from '@/modules/profiles/profiles.service';
import { ProfileForm } from '@/components/account/ProfileForm';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/account/settings');

  const profile = await getProfileByUserId(session.user.id);

  return (
    <Container className="flex flex-col gap-6 py-8">
      <PageHeader eyebrow="Account" title="Profile & Settings" description="Manage how you appear to other members." />

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
