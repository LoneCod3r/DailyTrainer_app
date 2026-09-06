import { Badge } from '@/components/ui';
import { SUBSCRIPTION_STATUS_TONE, subscriptionStatusKey } from '@/lib/billing-status';
import { formatCurrency } from '@/lib/format-currency';
import { formatDate } from '@/lib/format-date';
import { getT } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/locale';

type Subscription = {
  status: string;
  currentPeriodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean;
  membershipPlan: { name: string; amount: number; currency: string; interval: string };
} | null;

// Shared "what am I paying for" summary rendered on the Billing page. The
// Membership page has its own, lighter MembershipStatus component — this one
// additionally states the interval/amount, per Day 4 §9.
export function SubscriptionSummary({ subscription, locale }: { subscription: Subscription; locale: Locale }) {
  const t = getT(locale);

  if (!subscription) {
    return <p className="text-sm text-ink-500">{t('account.billing.noActiveSubscription')}</p>;
  }

  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
      <dt className="text-ink-500">{t('account.billing.plan')}</dt>
      <dd className="text-ink-900">{subscription.membershipPlan.name}</dd>

      <dt className="text-ink-500">{t('account.billing.status')}</dt>
      <dd>
        <Badge tone={SUBSCRIPTION_STATUS_TONE[subscription.status] ?? 'neutral'}>
          {t(subscriptionStatusKey(subscription.status))}
        </Badge>
      </dd>

      <dt className="text-ink-500">{t('account.billing.billingInterval')}</dt>
      <dd className="text-ink-900">
        {t(subscription.membershipPlan.interval === 'year' ? 'account.membership.perYear' : 'account.membership.perMonth')}
      </dd>

      <dt className="text-ink-500">{t('account.billing.amount')}</dt>
      <dd className="text-ink-900">
        {formatCurrency(subscription.membershipPlan.amount, subscription.membershipPlan.currency, locale)}
      </dd>

      {subscription.currentPeriodEnd && (
        <>
          <dt className="text-ink-500">{t('account.billing.nextBillingDate')}</dt>
          <dd className="text-ink-900">
            {subscription.cancelAtPeriodEnd
              ? t('account.membership.endsOn', { date: formatDate(subscription.currentPeriodEnd, locale) })
              : formatDate(subscription.currentPeriodEnd, locale)}
          </dd>
        </>
      )}
    </dl>
  );
}
