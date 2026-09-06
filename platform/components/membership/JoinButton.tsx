'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Alert } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

export function JoinButton({ membershipPlanId, disabled }: { membershipPlanId: string; disabled?: boolean }) {
  const t = useT();
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (status !== 'authenticated') {
      router.push('/login?callbackUrl=/account/membership');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/membership/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ membershipPlanId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setLoading(false);
        setError(data?.error?.message ?? t('account.membership.checkoutError'));
        return;
      }
      window.location.href = data.url;
    } catch {
      setLoading(false);
      setError(t('account.membership.checkoutError'));
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert tone="danger">{error}</Alert>}
      <Button onClick={onClick} loading={loading} disabled={disabled} className="w-full justify-center">
        {disabled ? t('account.membership.notYetAvailable') : t('account.membership.join')}
      </Button>
    </div>
  );
}
