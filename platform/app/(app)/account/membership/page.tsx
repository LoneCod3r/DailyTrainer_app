import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveSubscriptionForUser, listActivePlans } from '@/modules/membership/membership.service';
import { Container, Card, CardContent, Badge, EmptyState, Alert, Button } from '@/components/ui';
import { MembershipStatus } from '@/components/account/MembershipStatus';
import { JoinButton } from '@/components/membership/JoinButton';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { formatCurrency } from '@/lib/format-currency';
import { isModeratorOnly } from '@/lib/permissions';
import { redirect } from 'next/navigation';

const BENEFIT_KEYS = [
  'account.membership.benefit1',
  'account.membership.benefit2',
  'account.membership.benefit3',
  'account.membership.benefit4',
] as const;

export default async function MembershipPage({ searchParams }: { searchParams: { checkout?: string } }) {
  const session = await getServerSession(authOptions);
  // Page is publicly browsable (plan pricing is public info) — only a
  // signed-in Moderator is redirected away, since they're project staff and
  // never get the "join/manage membership" self-service surface.
  if (session?.user && isModeratorOnly(session.user.role)) redirect('/account');
  const locale = getLocale();
  const t = getT(locale);

  const [plans, subscription] = await Promise.all([
    listActivePlans(),
    session?.user ? getActiveSubscriptionForUser(session.user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="relative isolate">
      {/* `fixed` (not `absolute`) so this always covers the full viewport
          regardless of how tall the page's own content ends up being — an
          `absolute inset-0` here only stretches to match this wrapper's own
          content height (via percentage resolution through main's flex
          layout, which doesn't reliably propagate), leaving a blank gap
          below shorter content. `fixed` sizes directly to the viewport, so
          it isn't affected by that. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-[url('/images/membership/background.jpg')] bg-cover bg-center bg-no-repeat saturate-[1.15]"
      />
      {/* Translucent scrim (uses the theme's own page-background token, so
          it stays correct in dark mode) — keeps the page background from
          feeling too flat/bright without hiding the photo. The cards below
          (bg-surface, opaque) carry their own contrast regardless of this
          value. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 bg-page/45" />

      <Container className="flex flex-col gap-8 py-8 lg:gap-4 lg:pb-5 lg:pt-12">
        {searchParams.checkout === 'cancelled' && (
          <Alert tone="warning" title={t('account.membership.checkoutCancelledTitle')} className="max-w-xl">
            {t('account.membership.checkoutCancelledDesc')}
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
          <div className="flex flex-col gap-8 lg:gap-5">
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
          </div>

          <Card className="flex max-w-sm flex-col lg:ml-24 lg:min-h-[400px]">
            <CardContent className="flex flex-1 flex-col items-center gap-4 text-center lg:gap-3">
              <h2 className="text-lg font-semibold text-ink-900">{t('account.membership.availablePlans')}</h2>
              {plans.length === 0 ? (
                <EmptyState title={t('account.membership.noPlansTitle')} description={t('account.membership.noPlansDesc')} />
              ) : (
                <div className="flex w-full flex-1 flex-col items-center gap-6 lg:gap-4">
                  {plans.map((plan) => {
                    // The admin-configured description takes precedence; this
                    // is a display-only fallback for the seeded Premium plan,
                    // which has no description set in the database yet.
                    const description =
                      plan.description ??
                      (plan.name === 'KUKO WAY Premium' ? t('account.membership.premiumDescription') : null);

                    return (
                      <div key={plan.id} className="flex w-full flex-1 flex-col items-center gap-4 lg:gap-3">
                        <div>
                          {plan.name === 'KUKO WAY Premium' && (
                            <p className="mb-1.5 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-link">
                              <svg width="18" height="8" viewBox="0 0 18 8" fill="none" aria-hidden="true" className="shrink-0 opacity-70">
                                <path
                                  d="M0.5 4c1.6-3.2 3.2-3.2 4.8 0s3.2 3.2 4.8 0 3.2-3.2 4.8 0"
                                  stroke="currentColor"
                                  strokeWidth="1"
                                  strokeLinecap="round"
                                />
                              </svg>
                              Fascia Flow
                              <span className="font-normal normal-case tracking-normal text-ink-300">· Kuko Way</span>
                            </p>
                          )}
                          <Badge tone="brand">{t('account.membership.planBadge')}</Badge>
                          <h2 className="mt-2 text-lg font-semibold text-ink-900">{plan.name}</h2>
                          {description && <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-500">{description}</p>}
                        </div>
                        {/* Grouped and pushed to the bottom together (not
                            just the button alone) so the price stays close
                            to the action instead of a large gap opening up
                            between them. The top border reads as deliberate
                            structure (separating "what it is" from "price
                            and action") rather than empty space when the
                            card stretches taller than this plan's own
                            content — e.g. next to a longer "Your membership"
                            column. */}
                        <div className="mt-auto flex w-full flex-col items-center gap-3 border-t border-sand-200 pt-4">
                          <p className="text-2xl font-semibold text-ink-900">
                            {formatCurrency(plan.amount, plan.currency, locale)}{' '}
                            <span className="text-sm font-normal text-ink-500">
                              {t(plan.interval === 'year' ? 'account.membership.perYear' : 'account.membership.perMonth')}
                            </span>
                          </p>
                          <div className="w-full">
                            {plan.id === subscription?.membershipPlanId ? (
                              <Button disabled className="w-full justify-center">
                                {t('account.membership.activated')}
                              </Button>
                            ) : (
                              <JoinButton membershipPlanId={plan.id} disabled={!plan.stripePriceId} />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
