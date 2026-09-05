import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getActiveSubscriptionForUser } from '@/modules/membership/membership.service';
import { Container, Card, CardContent, Badge } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { MembershipIcon, BillingIcon, DonationIcon, SettingsIcon } from '@/components/layout/icons';

// Account is a secondary/supporting area, not the core practice experience —
// this hub links out to its sub-sections rather than surfacing all of their
// content here. Membership and Donation are kept as visually separate cards
// (recurring paid access vs. voluntary support).
export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login?callbackUrl=/account');

  const subscription = await getActiveSubscriptionForUser(session.user.id);

  return (
    <Container className="flex flex-col gap-8 py-8">
      <PageHeader title="Account" description="Your profile, membership, billing, and support settings." />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-ink-900">{session.user.name ?? session.user.email}</p>
            <p className="text-sm text-ink-500">{session.user.email}</p>
          </div>
          <Badge tone="brand">{session.user.role}</Badge>
        </CardContent>
      </Card>

      <div className="grid gap-5 sm:grid-cols-2">
        <Link href="/account/settings">
          <Card className="h-full transition-shadow hover:shadow-soft">
            <CardContent className="flex items-start gap-3">
              <SettingsIcon className="mt-0.5 shrink-0 text-ink-500" />
              <div>
                <h2 className="text-base font-semibold text-ink-900">Profile & Settings</h2>
                <p className="mt-1 text-sm text-ink-500">Your bio, avatar, and profile visibility.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/membership">
          <Card className="h-full transition-shadow hover:shadow-soft">
            <CardContent className="flex items-start gap-3">
              <MembershipIcon className="mt-0.5 shrink-0 text-brand-700" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-ink-900">Membership</h2>
                  <Badge tone={subscription ? 'success' : 'neutral'}>{subscription ? subscription.status : 'None'}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-500">Recurring access to the KUKO WAY practice.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/billing">
          <Card className="h-full transition-shadow hover:shadow-soft">
            <CardContent className="flex items-start gap-3">
              <BillingIcon className="mt-0.5 shrink-0 text-ink-500" />
              <div>
                <h2 className="text-base font-semibold text-ink-900">Billing</h2>
                <p className="mt-1 text-sm text-ink-500">Payment method, invoices, and receipts.</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/account/donation">
          <Card className="h-full border-sand-300 bg-sand-50 transition-shadow hover:shadow-soft">
            <CardContent className="flex items-start gap-3">
              <DonationIcon className="mt-0.5 shrink-0 text-ink-700" />
              <div>
                <h2 className="text-base font-semibold text-ink-900">Donation</h2>
                <p className="mt-1 text-sm text-ink-500">Voluntary, one-off support — separate from membership.</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </Container>
  );
}
