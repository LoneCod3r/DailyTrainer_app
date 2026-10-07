'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

// Starts a Reset Program checkout (Stripe TEST MODE). Sends no price or
// product data — the server resolves everything from the program slug — and
// just follows the Stripe Checkout URL it gets back.
export function BuyProgramButton({ programSlug, describedBy }: { programSlug: string; describedBy?: string }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/programs/${encodeURIComponent(programSlug)}/checkout`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }
      const code = data?.error?.code;
      if (code === 'ALREADY_OWNED') {
        setMessage(t('purchase.alreadyOwned'));
        router.refresh();
      } else if (code === 'EMAIL_NOT_VERIFIED') {
        setMessage(t('purchase.verifyEmail'));
      } else {
        setMessage(t('purchase.error'));
      }
    } catch {
      setMessage(t('purchase.error'));
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button size="lg" onClick={start} loading={busy} aria-describedby={describedBy} data-testid="buy-program">
        {t('purchase.cta')} →
      </Button>
      {message && (
        <p role="alert" className="text-sm text-ink-700">
          {message}
        </p>
      )}
    </div>
  );
}
