import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLatestSubscriptionForUser } from '@/modules/membership/membership.service';
import { getPaymentMethodForUser, listInvoicesForUser } from '@/modules/payments/billing.service';
import { isStripeConfigured } from '@/lib/stripe';
import { Container, Card, CardContent, CardHeader, CardTitle, Button, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { BillingPortalButton } from '@/components/account/BillingPortalButton';
import { SubscriptionSummary } from '@/components/account/SubscriptionSummary';
import { PaymentMethodSummary } from '@/components/account/PaymentMethodSummary';
import { InvoiceHistory } from '@/components/account/InvoiceHistory';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { isModeratorOnly } from '@/lib/permissions';

// Billing = "what am I paying for, how am I paying, and where can I manage
// it?" — payment method and invoices are read live from Stripe (never
// persisted/faked locally); management itself is delegated to Stripe's
// Customer Portal rather than rebuilt here (Day 4 §9). Moderator is project
// staff, not a customer — never gets this self-service surface, even by
// typing the URL directly (see lib/permissions.ts's isModeratorOnly).
export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/account/billing');
  if (isModeratorOnly(session.user.role)) redirect('/account');

  const locale = getLocale();
  const t = getT(locale);

  const [subscription, paymentMethod, invoices] = await Promise.all([
    getLatestSubscriptionForUser(session.user.id),
    getPaymentMethodForUser(session.user.id),
    listInvoicesForUser(session.user.id),
  ]);

  const hasAnyBillingHistory = Boolean(subscription) || Boolean(paymentMethod) || invoices.length > 0;
  const stripeConfigured = isStripeConfigured();

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow={t('nav.account')} title={t('account.billing.title')} description={t('account.billing.description')} />

      {!hasAnyBillingHistory ? (
        <EmptyState
          title={t('account.billing.emptyTitle')}
          description={t('account.billing.emptyDesc')}
          action={
            <Link href="/account/membership">
              <Button variant="secondary">{t('account.billing.viewMembership')}</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>{t('account.billing.currentSubscription')}</CardTitle>
            </CardHeader>
            <CardContent>
              <SubscriptionSummary subscription={subscription} locale={locale} />
            </CardContent>
          </Card>

          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle>{t('account.billing.paymentMethod')}</CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentMethodSummary paymentMethod={paymentMethod} locale={locale} />
            </CardContent>
          </Card>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>{t('account.billing.invoiceHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceHistory invoices={invoices} locale={locale} />
            </CardContent>
          </Card>

          <Card className="max-w-xl">
            <CardContent className="flex flex-col gap-3">
              {stripeConfigured ? (
                <>
                  <p className="text-sm text-ink-500">{t('account.billing.manageDescription')}</p>
                  <BillingPortalButton />
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-ink-900">{t('account.billing.portalUnavailableTitle')}</p>
                  <p className="text-sm text-ink-500">{t('account.billing.portalUnavailableDesc')}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </Container>
  );
}
