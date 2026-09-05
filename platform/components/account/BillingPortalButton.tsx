'use client';

import { useState } from 'react';
import { Button, Alert } from '@/components/ui';

export function BillingPortalButton() {
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
    <div className="flex flex-col gap-2">
      {error && <Alert tone="danger">{error}</Alert>}
      <div>
        <Button onClick={openPortal} loading={loading}>
          Manage billing in Stripe
        </Button>
      </div>
    </div>
  );
}
