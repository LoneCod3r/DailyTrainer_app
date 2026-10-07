'use client';

import { useState } from 'react';
import { clsx } from '@/lib/clsx';
import { Button, Textarea } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';
import { POST_FEELINGS, REFLECTION_NOTE_MAX, type PostFeeling } from '@/modules/kuko-way/check-ins';

// The day's NOTICE step (concept §23: MOVE · UNDERSTAND · NOTICE) — an
// optional, private reflection saved to the user's account only.
export function DayReflectionForm({
  programSlug,
  day,
  prompt,
  initialFeeling,
  initialNote,
}: {
  programSlug: string;
  day: number;
  prompt: string;
  initialFeeling?: PostFeeling;
  initialNote?: string;
}) {
  const t = useT();
  const [feeling, setFeeling] = useState<PostFeeling | undefined>(initialFeeling);
  const [note, setNote] = useState(initialNote ?? '');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  async function save() {
    setStatus('saving');
    try {
      const res = await fetch(`/api/programs/${encodeURIComponent(programSlug)}/days/${day}/reflection`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feeling, note }),
      });
      setStatus(res.ok ? 'saved' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-sand-200 bg-surface p-5 sm:p-8" aria-labelledby="notice-title">
      <h2 id="notice-title" className="font-serif text-2xl text-ink-900 sm:text-3xl">
        {t('resetPrograms.noticeTitle')}
      </h2>
      <p className="text-ink-700">{prompt}</p>
      <div role="group" aria-label={prompt} className="flex flex-wrap gap-2">
        {POST_FEELINGS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={feeling === value}
            onClick={() => {
              setFeeling((current) => (current === value ? undefined : value));
              setStatus('idle');
            }}
            className={clsx(
              'rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              feeling === value
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-sand-300 bg-surface text-ink-700 hover:border-brand-600',
            )}
          >
            {t(`practiceSession.post.${value}` as const)}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`reflection-${programSlug}-${day}`} className="text-sm font-medium text-ink-900">
          {t('practiceSession.noticeLabel')} <span className="font-normal text-ink-500">({t('practiceSession.noticeOptional')})</span>
        </label>
        <Textarea
          id={`reflection-${programSlug}-${day}`}
          value={note}
          rows={3}
          maxLength={REFLECTION_NOTE_MAX}
          onChange={(e) => {
            setNote(e.target.value);
            setStatus('idle');
          }}
        />
        <p className="text-xs text-ink-500">{t('practiceSession.noticePrivate')}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={save} loading={status === 'saving'} data-testid="reflection-save">
          {t('practiceSession.save')}
        </Button>
        <span role="status" className="text-sm text-link">
          {status === 'saved' ? t('resetPrograms.noticeSaved') : ''}
        </span>
        {status === 'error' && (
          <span role="alert" className="text-sm text-red-700 dark:text-red-300">
            {t('resetPrograms.actionError')}
          </span>
        )}
      </div>
    </section>
  );
}
