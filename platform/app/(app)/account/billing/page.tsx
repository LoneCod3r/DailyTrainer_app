import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveSubscriptionForUser } from '@/modules/membership/membership.service';
import { Container, Card, CardContent, EmptyState } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { BillingPortalButton } from '@/components/account/BillingPortalButton';

// Billing = payment method, invoices, receipts (via the Stripe customer
// portal). Kept separate from the Membership page, which only shows plan
// choice/status.
export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/account/billing');

  const subscription = await getActiveSubscriptionForUser(session.user.id);

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader eyebrow="Account" title="Billing" description="Payment method, invoices, and receipts." />

      {subscription ? (
        <Card className="max-w-xl">
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-ink-500">
              Manage your payment method, view invoices, and update or cancel your subscription in Stripe&apos;s
              secure billing portal.
            </p>
            <BillingPortalButton />
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="No billing history yet"
          description="Once you join a membership plan, your payment method and invoices will be manageable here."
        />
      )}
    </Container>
  );
}
