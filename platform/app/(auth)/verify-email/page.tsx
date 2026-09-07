'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Card, CardContent, Alert, Spinner } from '@/components/ui';
import { ResendVerificationForm } from '@/components/auth/ResendVerificationForm';
import { useT } from '@/lib/i18n/LocaleProvider';

type State = 'verifying' | 'success' | 'expired' | 'invalid' | 'missing';

export default function VerifyEmailPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>(token ? 'verifying' : 'missing');
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setState('success');
          return;
        }
        const data = await res.json().catch(() => null);
        const reason = data?.error?.details?.reason;
        setState(reason === 'EXPIRED' ? 'expired' : 'invalid');
      })
      .catch(() => setState('invalid'));
  }, [token]);

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-5 p-8 text-center">
          {state === 'verifying' && (
            <div className="flex flex-col items-center gap-3">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-ink-500">{t('auth.verifying')}</p>
            </div>
          )}

          {state === 'success' && (
            <>
              <h1 className="text-xl font-semibold text-ink-900">{t('auth.verifySuccessTitle')}</h1>
              <Alert tone="success">{t('auth.verifySuccessDesc')}</Alert>
              <Link href="/" className="text-sm font-medium text-brand-700 hover:underline">
                {t('auth.continueToApp')}
              </Link>
            </>
          )}

          {(state === 'expired' || state === 'invalid' || state === 'missing') && (
            <>
              <h1 className="text-xl font-semibold text-ink-900">
                {state === 'expired' ? t('auth.verifyExpiredTitle') : t('auth.verifyInvalidTitle')}
              </h1>
              <Alert tone="warning">
                {state === 'expired' ? t('auth.verifyExpiredDesc') : t('auth.verifyInvalidDesc')}
              </Alert>
              <div className="text-left">
                <p className="mb-2 text-sm font-medium text-ink-700">{t('auth.resendPrompt')}</p>
                <ResendVerificationForm />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
