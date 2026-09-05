import Link from 'next/link';
import { Badge, Button, Card, CardContent } from '@/components/ui';

type Subscription = {
  status: string;
  currentPeriodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean;
  membershipPlan: { name: string };
} | null;

const STATUS_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  TRIALING: 'success',
  PAST_DUE: 'warning',
  CANCELED: 'neutral',
  INCOMPLETE: 'warning',
  INCOMPLETE_EXPIRED: 'danger',
  UNPAID: 'danger',
};

// Shows membership status only — payment method/invoice management lives on
// the separate Billing page (/account/billing), kept apart on purpose.
export function MembershipStatus({ subscription }: { subscription: Subscription }) {
  return (
    <Card className="max-w-xl">
      <CardContent className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-ink-900">Your membership</h2>
        {subscription ? (
          <>
            <div className="flex items-center gap-2">
              <Badge tone={STATUS_TONE[subscription.status] ?? 'neutral'}>{subscription.status}</Badge>
              <span className="text-sm text-ink-700">{subscription.membershipPlan.name}</span>
            </div>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-ink-500">
                {subscription.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            <div>
              <Link href="/account/billing">
                <Button variant="secondary">Manage billing</Button>
              </Link>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-500">You don&apos;t have an active membership yet — choose a plan below.</p>
        )}
      </CardContent>
    </Card>
  );
}
