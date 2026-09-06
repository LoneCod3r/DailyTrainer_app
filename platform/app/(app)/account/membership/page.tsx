import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveSubscriptionForUser, listActivePlans } from '@/modules/membership/membership.service';
import { Container, Card, CardContent, Badge, EmptyState, Alert } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { MembershipStatus } from '@/components/account/MembershipStatus';
import { JoinButton } from '@/components/membership/JoinButton';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { formatCurrency } from '@/lib/format-currency';

const BENEFIT_KEYS = [
  'account.membership.benefit1',
  'account.membership.benefit2',
  'account.membership.benefit3',
  'account.membership.benefit4',
] as const;

export default async function MembershipPage({ searchParams }: { searchParams: { checkout?: string } }) {
  const session = await getServerSession(authOptions);
  const locale = getLocale();
  const t = getT(locale);

  const [plans, subscription] = await Promise.all([
    listActivePlans(),
    session?.user ? getActiveSubscriptionForUser(session.user.id) : Promise.resolve(null),
  ]);

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow={t('nav.account')}
        title={t('account.membership.title')}
        description={t('account.membership.description')}
      />

      {searchParams.checkout === 'cancelled' && (
        <Alert tone="warning" title={t('account.membership.checkoutCancelledTitle')} className="max-w-xl">
          {t('account.membership.checkoutCancelledDesc')}
        </Alert>
      )}

      {session?.user && <MembershipStatus subscription={subscription} locale={locale} />}

      <Card className="max-w-2xl">
        <CardContent className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-ink-900">{t('account.membership.benefitsTitle')}</h2>
          <ul className="flex flex-col gap-1.5 text-sm text-ink-700">
            {BENEFIT_KEYS.map((key) => (
              <li key={key} className="flex gap-2">
                <span aria-hidden="true" className="text-brand-600">
                  •
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-ink-900">{t('account.membership.availablePlans')}</h2>
        {plans.length === 0 ? (
          <EmptyState title={t('account.membership.noPlansTitle')} description={t('account.membership.noPlansDesc')} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <Badge tone="brand">{t('account.membership.planBadge')}</Badge>
                    <h2 className="mt-2 text-lg font-semibold text-ink-900">{plan.name}</h2>
                    {plan.description && <p className="mt-1 text-sm text-ink-500">{plan.description}</p>}
                  </div>
                  <p className="text-2xl font-semibold text-ink-900">
                    {formatCurrency(plan.amount, plan.currency, locale)}{' '}
                    <span className="text-sm font-normal text-ink-500">
                      {t(plan.interval === 'year' ? 'account.membership.perYear' : 'account.membership.perMonth')}
                    </span>
                  </p>
                  <div className="mt-auto">
                    <JoinButton membershipPlanId={plan.id} disabled={!plan.stripePriceId} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
