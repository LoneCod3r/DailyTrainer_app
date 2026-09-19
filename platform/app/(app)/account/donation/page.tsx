import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reconcileDonationFromCheckoutSession } from '@/modules/payments/billing.service';
import { isStripeConfigured } from '@/lib/stripe';
import { Container, Card, CardContent, Button, Alert } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { DonationForm } from '@/components/donation/DonationForm';
import { getLocale } from '@/lib/i18n/get-locale';
import { getT } from '@/lib/i18n/dictionaries';
import { formatCurrency } from '@/lib/format-currency';
import { isModeratorOnly } from '@/lib/permissions';

type Confirmation = {
  tone: 'success' | 'warning' | 'danger';
  title: string;
  description: string;
  amountLabel?: string;
};

// Donation is voluntary support — intentionally kept separate from
// Membership (recurring paid access), both in navigation and visually here.
// The success/cancelled states below only ever reflect the real Donation row
// (written by the verified webhook, see modules/payments/billing.service.ts)
// — reaching this URL never marks anything paid by itself.
export default async function DonationPage({
  searchParams,
}: {
  searchParams: { donation?: string; session_id?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/account/donation');
  // Moderator is project staff, not a donor — never gets this self-service
  // surface, even by typing the URL directly.
  if (isModeratorOnly(session.user.role)) redirect('/account');

  const locale = getLocale();
  const t = getT(locale);

  let confirmation: Confirmation | null = null;

  if (searchParams.donation === 'cancelled') {
    confirmation = {
      tone: 'warning',
      title: t('account.donation.cancelledTitle'),
      description: t('account.donation.cancelledDesc'),
    };
  } else if (searchParams.donation === 'success') {
    // Looks the donation up scoped to this user and, if the webhook hasn't
    // settled it yet, double-checks with Stripe server-side (never throws).
    const donation = searchParams.session_id
      ? await reconcileDonationFromCheckoutSession(session.user.id, searchParams.session_id)
      : null;

    if (!donation) {
      confirmation = {
        tone: 'danger',
        title: t('account.donation.invalidSessionTitle'),
        description: t('account.donation.invalidSessionDesc'),
      };
    } else if (donation.status === 'SUCCEEDED') {
      confirmation = {
        tone: 'success',
        title: t('account.donation.successTitle'),
        description: t('account.donation.successDesc'),
        amountLabel: formatCurrency(donation.amount, donation.currency, locale),
      };
    } else if (donation.status === 'FAILED' || donation.status === 'CANCELED') {
      confirmation = {
        tone: 'danger',
        title: t('account.donation.failedTitle'),
        description: t('account.donation.failedDesc'),
      };
    } else {
      // PENDING/PROCESSING/REQUIRES_ACTION — the webhook hasn't confirmed
      // this session yet. Honest "still confirming" state, never a false
      // success (Day 4 §13).
      confirmation = {
        tone: 'warning',
        title: t('account.donation.processingTitle'),
        description: t('account.donation.processingDesc'),
      };
    }
  }

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader
        eyebrow={t('nav.account')}
        title={t('account.donation.title')}
        description={t('account.donation.description')}
        centered
      />

      {confirmation && (
        <Card className="mx-auto w-full max-w-xl">
          <CardContent className="flex flex-col gap-3">
            <Alert tone={confirmation.tone} title={confirmation.title}>
              <p>{confirmation.description}</p>
              {confirmation.amountLabel && <p className="mt-1 font-semibold">{confirmation.amountLabel}</p>}
            </Alert>
            <div>
              <Link href="/account/donation">
                <Button variant="secondary">{t('account.donation.makeAnother')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {confirmation?.tone !== 'success' && <DonationForm disabled={!isStripeConfigured()} />}
    </Container>
  );
}
