'use client';

import { useRef, useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Container, Card, CardContent, Input, Button, Alert } from '@/components/ui';
import { Recaptcha } from '@/components/auth/Recaptcha';
import { HoneypotField } from '@/components/auth/HoneypotField';
import { MathChallenge, type MathChallengeValue } from '@/components/auth/MathChallenge';
import { useT } from '@/lib/i18n/LocaleProvider';

export default function RegisterPage() {
  const t = useT();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [mathChallenge, setMathChallenge] = useState<MathChallengeValue>({ challengeId: '', answer: '' });
  // A spent/rejected CAPTCHA token or math challenge can't be reused on a
  // retry — bumping this key remounts both widgets so the next submit gets
  // fresh ones, instead of silently resubmitting stale, already-consumed
  // tokens the server would (correctly) reject a second time.
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const formRenderedAt = useRef(Date.now());
  const autoRedirectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!captchaToken) {
      setError(t('auth.captchaRequired'));
      return;
    }
    if (!mathChallenge.challengeId) {
      setError(t('auth.mathChallengeRequired'));
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          captchaToken,
          website: formData.get('website') ?? '',
          formRenderedAt: formRenderedAt.current,
          mathChallengeId: mathChallenge.challengeId,
          mathAnswer: mathChallenge.answer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error?.message ?? t('auth.registerGenericError'));
        setLoading(false);
        setCaptchaToken(null);
        setMathChallenge({ challengeId: '', answer: '' });
        setChallengeAttempt((n) => n + 1);
        return;
      }

      // Sign in immediately so the new (unverified) account lands inside the
      // app, but stay on this page long enough to make the verification
      // email impossible to miss — see requirement for a distinct "check
      // your email" state, not just a redirect.
      const result = await signIn('credentials', { email, password, redirect: false });
      setLoading(false);
      setRegistered(true);

      if (!result?.error) {
        autoRedirectTimeout.current = setTimeout(() => {
          window.location.href = '/';
        }, 4000);
      }
    } catch {
      setError(t('auth.registerGenericError'));
      setLoading(false);
    }
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-5 p-8">
          {registered ? (
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-xl font-semibold text-ink-900">{t('auth.checkEmailTitle')}</h1>
              <Alert tone="success">{t('auth.checkEmailDesc', { email })}</Alert>
              <Link
                href="/"
                className="text-sm font-medium text-brand-700 hover:underline"
                onClick={() => {
                  if (autoRedirectTimeout.current) clearTimeout(autoRedirectTimeout.current);
                }}
              >
                {t('auth.continueToApp')}
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 text-center">
                <h1 className="text-xl font-semibold text-ink-900">{t('auth.registerTitle')}</h1>
                <p className="text-sm text-ink-500">{t('auth.registerSubtitle')}</p>
              </div>

              {error && <Alert tone="danger">{error}</Alert>}

              <form onSubmit={onSubmit} className="flex flex-col gap-4">
                <HoneypotField />
                <Input
                  label={t('auth.nameLabel')}
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
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
                <MathChallenge key={`math-${challengeAttempt}`} onChange={setMathChallenge} />
                <Recaptcha key={`recaptcha-${challengeAttempt}`} onVerify={setCaptchaToken} />
                <Button
                  type="submit"
                  loading={loading}
                  disabled={!captchaToken || !mathChallenge.challengeId}
                  className="w-full"
                >
                  {t('auth.registerButton')}
                </Button>
              </form>

              <p className="text-center text-sm text-ink-500">
                {t('auth.hasAccount')}{' '}
                <Link href="/login" className="font-medium text-brand-700 hover:underline">
                  {t('auth.logIn')}
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
