import Link from 'next/link';
import { Badge } from '@/components/ui';
import { SUBSCRIPTION_STATUS_TONE, subscriptionStatusKey } from '@/lib/billing-status';
import { formatDate } from '@/lib/format-date';
import type { Locale } from '@/lib/i18n/locale';
import type { DictKey } from '@/lib/i18n/dictionaries';

type Subscription = {
  status: string;
  currentPeriodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean;
  membershipPlan: { name: string };
} | null;

// The Home dashboard's membership-aware section (Part 2 §"Membership
// status") — real plan/status/renewal data, same source as /account and
// /account/billing (getActiveSubscriptionForUser), just surfaced where a
// Paid User actually lands day to day instead of only on a sub-page. Free
// users get one restrained line + a link, never a locked-feature pitch.
export function MembershipStrip({
  subscription,
  locale,
  t,
}: {
  subscription: Subscription;
  locale: Locale;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-sand-200 pt-14 sm:flex-row sm:items-center sm:justify-between sm:gap-10">
      <div className="flex flex-1 flex-col gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">{t('home.membership')}</h2>
        {subscription ? (
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={SUBSCRIPTION_STATUS_TONE[subscription.status] ?? 'neutral'}>
              {t(subscriptionStatusKey(subscription.status))}
            </Badge>
            <span className="font-serif text-2xl text-ink-900 sm:text-3xl">{subscription.membershipPlan.name}</span>
            {subscription.currentPeriodEnd && (
              <span className="text-sm text-ink-500">
                {t(subscription.cancelAtPeriodEnd ? 'account.membership.endsOn' : 'account.membership.renewsOn', {
                  date: formatDate(subscription.currentPeriodEnd, locale),
                })}
              </span>
            )}
          </div>
        ) : (
          <p className="text-base text-ink-500">{t('home.membershipFreeDesc')}</p>
        )}
      </div>
      <Link
        href={subscription ? '/account/billing' : '/account/membership'}
        className="w-fit shrink-0 text-base font-medium text-link hover:underline"
      >
        {subscription ? t('home.manageMembership') : t('home.supportCta')} →
      </Link>
    </section>
  );
}
