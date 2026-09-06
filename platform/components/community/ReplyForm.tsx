'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Textarea, Button, Alert } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

export function ReplyForm({ discussionSlug }: { discussionSlug: string }) {
  const t = useT();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch(`/api/discussions/${discussionSlug}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();

    setSubmitting(false);
    if (!res.ok) {
      setError(data?.error?.message ?? t('discussions.submitError'));
      return;
    }

    setBody('');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      {error && <Alert tone="danger">{error}</Alert>}
      <Textarea
        aria-label={t('discussions.fieldBody')}
        placeholder={t('discussions.replyPlaceholder')}
        required
        minLength={2}
        maxLength={4000}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div>
        <Button type="submit" size="sm" loading={submitting}>
          {t('discussions.replySubmit')}
        </Button>
      </div>
    </form>
  );
}
