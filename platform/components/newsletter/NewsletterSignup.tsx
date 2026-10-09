'use client';

import { useRef, useState, type FormEvent } from 'react';
import { clsx } from '@/lib/clsx';
import { Button, Input } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import { newsletterSignupSchema } from '@/lib/validations/newsletter';
import { subscribeToNewsletter } from '@/lib/newsletter';

type Status = 'idle' | 'submitting' | 'success' | 'error';

// Footer newsletter signup: heading, one line of copy, email + button —
// nothing else. Success is shown only when lib/newsletter.ts reports the
// subscription service accepted the request; until a provider is wired up
// there, every submission ends in the service error.
export function NewsletterSignup() {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'submitting') return;

    const parsed = newsletterSignupSchema.safeParse({ email });
    if (!parsed.success) {
      setInvalid(true);
      setStatus('idle');
      inputRef.current?.focus();
      return;
    }

    setInvalid(false);
    setStatus('submitting');
    try {
      const result = await subscribeToNewsletter(parsed.data.email);
      setStatus(result.ok ? 'success' : 'error');
      if (result.ok) setEmail('');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section aria-labelledby="newsletter-title">
      <h2 id="newsletter-title" className="text-base font-semibold text-ink-900">
        {t('newsletter.title')}
      </h2>
      <p className="mt-1 text-sm text-ink-500">{t('newsletter.description')}</p>

      <form
        aria-label={t('newsletter.formLabel')}
        onSubmit={handleSubmit}
        noValidate
        className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:items-start"
      >
        <label htmlFor="newsletter-email" className="sr-only">
          {t('newsletter.emailLabel')}
        </label>
        <div className="min-w-0 flex-1">
          <Input
            ref={inputRef}
            id="newsletter-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (invalid) setInvalid(false);
              if (status === 'success' || status === 'error') setStatus('idle');
            }}
            placeholder={t('newsletter.emailPlaceholder')}
            error={invalid ? t('newsletter.invalidEmail') : undefined}
          />
        </div>
        <Button type="submit" loading={status === 'submitting'} className="shrink-0">
          {t('newsletter.submit')}
        </Button>
      </form>

      <p
        role="status"
        aria-live="polite"
        className={clsx(
          'mt-2 text-sm',
          status === 'success' && 'text-ink-700',
          status === 'error' && 'text-red-600 dark:text-red-400',
        )}
      >
        {status === 'success' ? t('newsletter.success') : status === 'error' ? t('newsletter.error') : null}
      </p>
    </section>
  );
}
