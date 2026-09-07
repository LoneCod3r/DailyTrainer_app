'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Container, Card, CardContent, Input, Button, Alert } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

export default function ForgotPasswordPage() {
  const t = useT();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState('loading');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? 'sent' : 'error');
    } catch {
      setState('error');
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-5 p-8">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-xl font-semibold text-ink-900">{t('auth.forgotPasswordTitle')}</h1>
            <p className="text-sm text-ink-500">{t('auth.forgotPasswordSubtitle')}</p>
          </div>

          {state === 'sent' ? (
            <Alert tone="success">{t('auth.forgotPasswordSent')}</Alert>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
              <Button type="submit" loading={state === 'loading'} className="w-full">
                {t('auth.forgotPasswordButton')}
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-ink-500">
            <Link href="/login" className="font-medium text-brand-700 hover:underline">
              {t('auth.backToLogin')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
