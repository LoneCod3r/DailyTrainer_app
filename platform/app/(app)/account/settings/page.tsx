import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getProfileByUserId } from '@/modules/profiles/profiles.service';
import { ProfileForm } from '@/components/account/ProfileForm';
import { Container, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/account/settings');

  const locale = getLocale();
  const t = getT(locale);
  const profile = await getProfileByUserId(session.user.id);

  return (
    <Container className="flex flex-col gap-6 py-8">
      <PageHeader
        eyebrow={t('nav.account')}
        title={t('account.settings.title')}
        description={t('account.settings.description')}
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t('account.settings.accountSectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div>
            <p className="text-ink-500">{t('account.settings.nameLabel')}</p>
            <p className="text-ink-900">{session.user.name ?? '—'}</p>
          </div>
          <div>
            <p className="text-ink-500">{t('account.settings.emailLabel')}</p>
            <p className="text-ink-900">{session.user.email}</p>
          </div>
        </CardContent>
      </Card>

      <div className="max-w-xl">
        <h2 className="mb-3 text-base font-semibold text-ink-900">{t('account.settings.profileSectionTitle')}</h2>
        <ProfileForm
          initialProfile={{
            bio: profile?.bio ?? null,
            avatarUrl: profile?.avatarUrl ?? null,
            interests: profile?.interests ?? [],
            visibility: profile?.visibility ?? 'MEMBERS',
          }}
        />
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t('account.settings.preferencesSectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-500">{t('account.settings.languageLabel')}</p>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t('account.settings.themeSectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-500">{t('account.settings.themeDescription')}</p>
          <ThemeToggle className="border border-sand-200" />
        </CardContent>
      </Card>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t('account.settings.notificationsSectionTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-500">{t('account.settings.notificationsPlaceholder')}</p>
        </CardContent>
      </Card>
    </Container>
  );
}
