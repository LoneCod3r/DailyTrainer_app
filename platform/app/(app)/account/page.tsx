import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveSubscriptionForUser } from '@/modules/membership/membership.service';
import { Container, Card, CardContent, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { MembershipIcon, BillingIcon, DonationIcon, SettingsIcon } from '@/components/layout/icons';
import { SUBSCRIPTION_STATUS_TONE, subscriptionStatusKey } from '@/lib/billing-status';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT, type DictKey } from '@/lib/i18n/dictionaries';

const ROLE_KEY: Record<string, DictKey> = {
  USER: 'profile.roleUser',
  MODERATOR: 'profile.roleModerator',
  ADMIN: 'profile.roleAdmin',
};

// Account is a secondary/supporting area, not the core practice experience —
// this hub links out to its sub-sections rather than surfacing all of their
// content here. Membership and Donation are kept as visually separate cards
// (recurring paid access vs. voluntary support).
export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/account');

  const locale = getLocale();
  const t = getT(locale);
  const subscription = await getActiveSubscriptionForUser(session.user.id);

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader title={t('account.hub.title')} description={t('account.hub.description')} />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-ink-900">{session.user.name ?? session.user.email}</p>
            <p className="text-sm text-ink-500">{session.user.email}</p>
          </div>
          <Badge tone="brand">{t(ROLE_KEY[session.user.role] ?? 'profile.roleUser')}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Link href="/account/settings">
          <Card className="h-full transition-shadow hover:shadow-soft">
            <CardContent className="flex items-start gap-3">
              <SettingsIcon className="mt-0.5 shrink-0 text-ink-500" />
              <div>
                <h2 className="text-base font-semibold text-ink-900">{t('account.hub.profileTitle')}</h2>
                <p className="mt-1 text-sm text-ink-500">{t('account.hub.profileDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/membership">
          <Card className="h-full transition-shadow hover:shadow-soft">
            <CardContent className="flex items-start gap-3">
              <MembershipIcon className="mt-0.5 shrink-0 text-brand-700" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-ink-900">{t('account.hub.membershipTitle')}</h2>
                  <Badge tone={subscription ? SUBSCRIPTION_STATUS_TONE[subscription.status] ?? 'neutral' : 'neutral'}>
                    {subscription ? t(subscriptionStatusKey(subscription.status)) : t('account.hub.noMembership')}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-ink-500">{t('account.hub.membershipDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/billing">
          <Card className="h-full transition-shadow hover:shadow-soft">
            <CardContent className="flex items-start gap-3">
              <BillingIcon className="mt-0.5 shrink-0 text-ink-500" />
              <div>
                <h2 className="text-base font-semibold text-ink-900">{t('account.hub.billingTitle')}</h2>
                <p className="mt-1 text-sm text-ink-500">{t('account.hub.billingDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/donation">
          <Card className="h-full border-sand-300 bg-sand-50 transition-shadow hover:shadow-soft">
            <CardContent className="flex items-start gap-3">
              <DonationIcon className="mt-0.5 shrink-0 text-ink-700" />
              <div>
                <h2 className="text-base font-semibold text-ink-900">{t('account.hub.donationTitle')}</h2>
                <p className="mt-1 text-sm text-ink-500">{t('account.hub.donationDesc')}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </Container>
  );
}
