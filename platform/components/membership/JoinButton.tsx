'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button, Alert } from '@/components/ui';

export function JoinButton({ membershipPlanId, disabled }: { membershipPlanId: string; disabled?: boolean }) {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (status !== 'authenticated') {
      router.push('/login?callbackUrl=/membership');
      return;
    }

    setLoading(true);
    setError(null);
    const res = await fetch('/api/membership/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipPlanId }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data?.error?.message ?? 'Failed to start checkout');
      return;
    }
    window.location.href = data.url;
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <Alert tone="danger">{error}</Alert>}
      <Button onClick={onClick} loading={loading} disabled={disabled} className="w-full justify-center">
        {disabled ? 'Not yet available' : 'Join'}
      </Button>
    </div>
  );
}
