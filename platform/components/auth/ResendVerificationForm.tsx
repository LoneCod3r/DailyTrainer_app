'use client';

import { useState, type FormEvent } from 'react';
import { Input, Button, Alert } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

// Shared by the login page's "unverified" alert, the /verify-email
// expired/invalid states, and the account settings page — always POSTs to
// the same rate-limited, enumeration-safe endpoint (see
// app/api/auth/verify-email/resend/route.ts) and always shows the same
// generic confirmation regardless of what actually happened server-side.
export function ResendVerificationForm({ initialEmail = '' }: { initialEmail?: string }) {
  const t = useT();
  const [email, setEmail] = useState(initialEmail);
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/auth/verify-email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'sent') {
    return <Alert tone="success">{t('auth.resendSent')}</Alert>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {state === 'error' && <Alert tone="danger">{t('auth.resendError')}</Alert>}
      <Input
        label={t('auth.emailLabel')}
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" loading={state === 'loading'} variant="secondary" className="w-full">
        {t('auth.resendButton')}
      </Button>
    </form>
  );
}
