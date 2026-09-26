'use client';

import { useState, type FormEvent } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Card, CardContent, Input, Button, Alert } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import type { DictKey } from '@/lib/i18n/dictionaries';
import { safeInternalPath } from '@/lib/safe-redirect';

const ERROR_KEY: Record<string, DictKey> = {
  RATE_LIMITED: 'auth.loginRateLimited',
  ACCOUNT_LOCKED: 'auth.loginAccountLocked',
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError(t(ERROR_KEY[result.error] ?? 'auth.loginError'));
      return;
    }

    // An explicit callbackUrl (set when a protected route redirected here,
    // e.g. app/admin/layout.tsx's redirect('/login?callbackUrl=/admin'))
    // always wins — the user was headed somewhere specific. Only the
    // "plain /login, no destination in mind" case falls back to a
    // role-based landing page instead of always defaulting to "/". It comes
    // from the URL, so anything that isn't an internal path (external URLs,
    // "//host", "javascript:", ...) is discarded and treated as absent.
    let destination = safeInternalPath(searchParams.get('callbackUrl'));
    if (!destination) {
      const session = await getSession();
      const role = session?.user?.role;
      destination = role === 'ADMIN' ? '/admin' : role === 'MODERATOR' ? '/moderation' : '/';
    }

    // A hard navigation, not router.push()+refresh(): the (auth) layout's
    // logo link to "/" gets prefetched while this page is open, so a soft
    // navigation right after signing in can render that stale,
    // pre-authentication cache entry instead of picking up the new session.
    window.location.href = destination;
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-5 p-8">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-xl font-semibold text-ink-900">{t('auth.loginTitle')}</h1>
            <p className="text-sm text-ink-500">{t('auth.loginSubtitle')}</p>
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label={t('auth.emailLabel')}
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <Input
                label={t('auth.passwordLabel')}
                type="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Link href="/forgot-password" className="self-end text-xs font-medium text-brand-700 hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <Button type="submit" loading={loading} className="w-full">
              {t('auth.loginButton')}
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="font-medium text-brand-700 hover:underline">
              {t('auth.createOne')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
