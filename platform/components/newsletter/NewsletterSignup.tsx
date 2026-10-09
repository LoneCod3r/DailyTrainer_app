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

  // Heading, description, then the field and a full-width Join button of the
  // same width — centred when stacked, on the footer's shared left edge from
  // lg up. Root font size is 18px (globals.css), so 22rem caps the form at
  // ~396px and h-10 is ~45px.
  return (
    <section
      aria-labelledby="newsletter-title"
      className="mx-auto flex w-full max-w-md flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left"
    >
      <h2 id="newsletter-title" className="font-serif text-2xl text-ink-900">
        {t('newsletter.title')}
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">{t('newsletter.description')}</p>

      <form
        aria-label={t('newsletter.formLabel')}
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 flex w-full max-w-[22rem] flex-col gap-2.5 text-left"
      >
        <label htmlFor="newsletter-email" className="sr-only">
          {t('newsletter.emailLabel')}
        </label>
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
          className="h-10 text-center placeholder:text-center"
        />
        <Button type="submit" loading={status === 'submitting'} className="h-10 w-full">
          {t('newsletter.submit')}
        </Button>
      </form>

      <p
        role="status"
        aria-live="polite"
        className={clsx(
          'mt-3 max-w-[22rem] text-sm',
          status === 'success' && 'text-ink-700',
          status === 'error' && 'text-red-600 dark:text-red-400',
        )}
      >
        {status === 'success' ? t('newsletter.success') : status === 'error' ? t('newsletter.error') : null}
      </p>
    </section>
  );
}
