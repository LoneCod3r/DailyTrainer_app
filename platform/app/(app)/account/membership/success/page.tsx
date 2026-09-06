import Link from 'next/link';
import { Container, Card, CardContent, Button } from '@/components/ui';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';

// Reached only via Stripe Checkout's success_url — this page never marks
// anything paid itself; it just tells the member their subscription is being
// confirmed. The verified customer.subscription.* webhook is the source of
// truth (see modules/payments/billing.service.ts).
export default function MembershipSuccessPage() {
  const t = getT(getLocale());

  return (
    <Container className="flex flex-col items-center gap-6 py-16 text-center">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-10">
          <h1 className="text-xl font-semibold text-ink-900">{t('account.membership.successTitle')}</h1>
          <p className="text-sm text-ink-500">{t('account.membership.successDesc')}</p>
          <Link href="/account/membership">
            <Button>{t('account.membership.goToMembership')}</Button>
          </Link>
        </CardContent>
      </Card>
    </Container>
  );
}
