'use client';

import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Card, CardContent, Input, Button, Alert } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

type State = 'form' | 'loading' | 'success' | 'expired' | 'invalid' | 'error';

export default function ResetPasswordPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<State>(token ? 'form' : 'invalid');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setState('loading');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (res.ok) {
        setState('success');
        return;
      }

      const data = await res.json().catch(() => null);
      const reason = data?.error?.details?.reason;
      setState(reason === 'EXPIRED' ? 'expired' : reason === 'INVALID' || reason === 'USED' ? 'invalid' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-5 p-8 text-center">
          {state === 'success' && (
            <>
              <h1 className="text-xl font-semibold text-ink-900">{t('auth.resetSuccessTitle')}</h1>
              <Alert tone="success">{t('auth.resetSuccessDesc')}</Alert>
              <Link href="/login" className="text-sm font-medium text-brand-700 hover:underline">
                {t('auth.backToLogin')}
              </Link>
            </>
          )}

          {(state === 'expired' || state === 'invalid') && (
            <>
              <h1 className="text-xl font-semibold text-ink-900">
                {state === 'expired' ? t('auth.resetExpiredTitle') : t('auth.resetInvalidTitle')}
              </h1>
              <Alert tone="warning">{state === 'expired' ? t('auth.resetExpiredDesc') : t('auth.resetInvalidDesc')}</Alert>
              <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
                {t('auth.requestNewLink')}
              </Link>
            </>
          )}

          {(state === 'form' || state === 'loading' || state === 'error') && (
            <>
              <div className="flex flex-col gap-1">
                <h1 className="text-xl font-semibold text-ink-900">{t('auth.resetPasswordTitle')}</h1>
                <p className="text-sm text-ink-500">{t('auth.resetPasswordSubtitle')}</p>
              </div>
              {state === 'error' && <Alert tone="danger">{t('auth.registerGenericError')}</Alert>}
              <form onSubmit={onSubmit} className="flex flex-col gap-4 text-left">
                <Input
                  label={t('auth.newPasswordLabel')}
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  hint={t('auth.passwordHint')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" loading={state === 'loading'} className="w-full">
                  {t('auth.resetPasswordButton')}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
