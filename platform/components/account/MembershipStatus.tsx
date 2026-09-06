import Link from 'next/link';
import { Badge, Button, Card, CardContent } from '@/components/ui';
import { SUBSCRIPTION_STATUS_TONE, subscriptionStatusKey } from '@/lib/billing-status';
import { formatDate } from '@/lib/format-date';
import { getT } from '@/lib/i18n/dictionaries';
import type { Locale } from '@/lib/i18n/locale';

type Subscription = {
  status: string;
  currentPeriodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean;
  membershipPlan: { name: string };
} | null;

// Shows membership status only — payment method/invoice management lives on
// the separate Billing page (/account/billing), kept apart on purpose.
export function MembershipStatus({ subscription, locale }: { subscription: Subscription; locale: Locale }) {
  const t = getT(locale);

  return (
    <Card className="max-w-xl">
      <CardContent className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-ink-900">{t('account.membership.yourMembership')}</h2>
        {subscription ? (
          <>
            <div className="flex items-center gap-2">
              <Badge tone={SUBSCRIPTION_STATUS_TONE[subscription.status] ?? 'neutral'}>
                {t(subscriptionStatusKey(subscription.status))}
              </Badge>
              <span className="text-sm text-ink-700">{subscription.membershipPlan.name}</span>
            </div>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-ink-500">
                {t(subscription.cancelAtPeriodEnd ? 'account.membership.endsOn' : 'account.membership.renewsOn', {
                  date: formatDate(subscription.currentPeriodEnd, locale),
                })}
              </p>
            )}
            <div>
              <Link href="/account/billing">
                <Button variant="secondary">{t('account.membership.manageBilling')}</Button>
              </Link>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-500">{t('account.membership.noneDescription')}</p>
        )}
      </CardContent>
    </Card>
  );
}
