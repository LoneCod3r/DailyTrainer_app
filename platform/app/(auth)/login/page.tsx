'use client';

import { useState, type FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Container, Card, CardContent, Input, Button, Alert } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      setError('Invalid email or password.');
      return;
    }

    router.push(searchParams.get('callbackUrl') ?? '/');
    router.refresh();
  }

  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-5 p-8">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-xl font-semibold text-ink-900">Welcome back</h1>
            <p className="text-sm text-ink-500">Log in to your account</p>
          </div>

          {error && <Alert tone="danger">{error}</Alert>}

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              name="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" loading={loading} className="w-full">
              Log in
            </Button>
          </form>

          <p className="text-center text-sm text-ink-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-brand-700 hover:underline">
              Create one
            </Link>
          </p>
        </CardContent>
      </Card>
    </Container>
  );
}
