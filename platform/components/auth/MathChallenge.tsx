'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { Input, Button, Spinner } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

export type MathChallengeValue = { challengeId: string; answer: string };

// A simple arithmetic anti-bot challenge — one more layer alongside CAPTCHA/
// honeypot/rate limiting (see lib/math-challenge.ts), not a replacement for
// any of them. The question is fetched from the server on mount (and again
// on request); the expected answer never travels to the client — only
// `challengeId` and the question text do. The parent form remounts this
// component (via a changing `key`) after a failed submit, since a spent or
// rejected challenge can't be reused.
export function MathChallenge({ onChange }: { onChange: (value: MathChallengeValue) => void }) {
  const t = useT();
  const inputId = useId();
  const [question, setQuestion] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [failedToLoad, setFailedToLoad] = useState(false);

  const fetchChallenge = useCallback(async () => {
    setLoading(true);
    setFailedToLoad(false);
    setAnswer('');
    try {
      const res = await fetch('/api/auth/math-challenge', { method: 'POST' });
      if (!res.ok) throw new Error('request failed');
      const data = await res.json();
      setChallengeId(data.challengeId);
      setQuestion(data.question);
    } catch {
      setChallengeId('');
      setQuestion(null);
      setFailedToLoad(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenge();
  }, [fetchChallenge]);

  useEffect(() => {
    onChange({ challengeId, answer });
    // onChange is a fresh closure every render on the caller's side; only
    // re-fire when the actual values change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, answer]);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
        {t('auth.mathChallengeLabel')}
      </label>
      <div className="flex items-center gap-2">
        {loading ? (
          <Spinner className="h-5 w-5" />
        ) : failedToLoad ? (
          <span className="text-sm text-red-600 dark:text-red-400">{t('auth.mathChallengeError')}</span>
        ) : (
          <span data-testid="math-question" className="whitespace-nowrap text-sm text-ink-900">
            {question} =
          </span>
        )}
        <Input
          id={inputId}
          name="mathAnswer"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          required
          disabled={loading || failedToLoad}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="w-24"
        />
        <Button type="button" variant="ghost" size="sm" onClick={fetchChallenge} disabled={loading}>
          {t('auth.mathChallengeNew')}
        </Button>
      </div>
    </div>
  );
}
