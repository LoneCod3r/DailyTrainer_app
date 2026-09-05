import Link from 'next/link';
import { Container, Card, CardContent, Button } from '@/components/ui';

// Reached only via Stripe Checkout's success_url — this page never marks
// anything paid itself; it just tells the member their subscription is being
// confirmed. The verified customer.subscription.* webhook is the source of
// truth (see modules/payments/billing.service.ts).
export default function MembershipSuccessPage() {
  return (
    <Container className="flex flex-col items-center gap-6 py-16 text-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <h1 className="text-xl font-semibold text-ink-900">Thanks for joining!</h1>
          <p className="text-sm text-ink-500">
            We&apos;re confirming your payment with Stripe now — this can take a few seconds. Your membership
            status will update automatically once it&apos;s confirmed.
          </p>
          <Link href="/account/membership">
            <Button>Go to my membership</Button>
          </Link>
        </CardContent>
      </Card>
    </Container>
  );
}
