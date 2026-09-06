'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container, Card, CardContent, Input, Button, Alert } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

export default function RegisterPage() {
  const router = useRouter();
  const t = useT();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? t('auth.registerGenericError'));
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', { email, password, redirect: false });
      setLoading(false);

      if (result?.error) {
        router.push('/login');
        return;
      }

      // A hard navigation, not router.push()+refresh() — see the same
      // comment in login/page.tsx: a soft navigation right after
      // authenticating can render the (auth) layout's prefetched,
      // pre-session cache entry for "/" instead of the new session.
      window.location.href = '/';
    } catch {
      setError(t('auth.registerGenericError'));
      setLoading(false);
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-5 p-8">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-xl font-semibold text-ink-900">{t('auth.registerTitle')}</h1>
            <p className="text-sm text-ink-500">{t('auth.registerSubtitle')}</p>
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input label={t('auth.nameLabel')} name="name" required value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label={t('auth.emailLabel')}
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label={t('auth.passwordLabel')}
              type="password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              hint={t('auth.passwordHint')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading} className="w-full">
              {t('auth.registerButton')}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500">
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className="font-medium text-brand-700 hover:underline">
              {t('auth.logIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
