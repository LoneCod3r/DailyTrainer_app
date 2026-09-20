'use client';

import { useState } from 'react';
import { Button, Alert } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

export function BillingPortalButton({ label, variant }: { label?: string; variant?: 'primary' | 'secondary' }) {
  const t = useT();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/membership/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        setError(data?.error?.message ?? t('account.billing.portalError'));
        return;
      }
      window.location.href = data.url;
    } catch {
      setLoading(false);
      setError(t('account.billing.portalError'));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert tone="danger">{error}</Alert>}
      <div>
        <Button
          onClick={openPortal}
          loading={loading}
          variant={variant}
          // Button is nowrap with px-4 by default. On phones, trim the padding slightly and let the longer
          // Bulgarian label wrap instead of overflowing the card; desktop (sm and up) is unchanged.
          className="max-w-full max-sm:whitespace-normal max-sm:px-3 max-sm:text-center"
        >
          {label ?? t('account.billing.managePortal')}
        </Button>
      </div>
    </div>
  );
}
