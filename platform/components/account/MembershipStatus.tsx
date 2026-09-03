'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Alert, Card, CardContent } from '@/components/ui';

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

export function MembershipStatus({ subscription }: { subscription: Subscription }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/membership/portal', { method: 'POST' });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.error?.message ?? 'Failed to open the billing portal');
      return;
    }
    window.location.href = data.url;
  }

  return (
    <Card className="max-w-xl">
      <CardContent className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-ink-900">Membership</h2>
        {error && <Alert tone="danger">{error}</Alert>}
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
              <Button variant="secondary" onClick={openPortal} loading={loading}>
                Manage billing
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-500">You don&apos;t have an active membership yet.</p>
            <div>
              <Link href="/membership">
                <Button>View membership plans</Button>
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
