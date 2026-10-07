'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Textarea } from '@/components/ui';
import { clsx } from '@/lib/clsx';
import { useT } from '@/lib/i18n/LocaleProvider';
import { newClientId, recordPractice } from '@/lib/progress/client';
import { POST_FEELINGS, PRE_FEELINGS, REFLECTION_NOTE_MAX, type PostFeeling, type PreFeeling } from '@/modules/kuko-way/check-ins';

export interface SessionStep {
  label?: string;
  text: string;
}

type Phase = 'idle' | 'before' | 'active' | 'after' | 'done';

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// The guided practice flow (KUKO WAY concept §8–9):
//   BEGIN → "Before you start" check-in → practice mode (near-black, timer,
//   one step at a time, minimal) → "Take a moment" + optional private note →
//   "Practice complete. You showed up for yourself."
// Check-ins and notes exist only for signed-in users (they're stored
// privately on the account); signed-out visitors practise the same way and
// the completion is kept on this device only (lib/progress/client.ts).
export function PracticeSession({
  practiceSlug,
  steps,
  signedIn,
}: {
  practiceSlug: string;
  steps: SessionStep[];
  signedIn: boolean;
}) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>('idle');
  const [pre, setPre] = useState<PreFeeling[]>([]);
  const [post, setPost] = useState<PostFeeling | undefined>();
  const [note, setNote] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  // One id per attempt — the server's idempotency key, so a retried save
  // after a network error can never record the practice twice.
  const clientId = useRef('');
  const startedAt = useRef(0);
  const durationSec = useRef(0);
  const panelHeading = useRef<HTMLHeadingElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (phase !== 'active') return;
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Move focus with the flow so keyboard and screen-reader users land on the
  // new step instead of a button that just disappeared.
  useEffect(() => {
    if (phase === 'idle') return;
    panelHeading.current?.focus();
  }, [phase]);

  function begin() {
    clientId.current = newClientId();
    setPre([]);
    setPost(undefined);
    setNote('');
    setError(false);
    if (signedIn) setPhase('before');
    else startPractice();
  }

  function startPractice() {
    startedAt.current = Date.now();
    setElapsed(0);
    setStepIndex(0);
    setPhase('active');
    sectionRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  async function save(withCheckIn: boolean) {
    setSaving(true);
    setError(false);
    try {
      await recordPractice(signedIn, {
        clientId: clientId.current,
        practiceSlug,
        durationSec: durationSec.current,
        preFeelings: pre,
        postFeeling: withCheckIn ? post : undefined,
        note: withCheckIn && note.trim() ? note.trim() : undefined,
      });
      setPhase('done');
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  function finish() {
    durationSec.current = Math.floor((Date.now() - startedAt.current) / 1000);
    if (signedIn) setPhase('after');
    else void save(false);
  }

  function exit() {
    setPhase('idle');
  }

  const togglePre = (value: PreFeeling) =>
    setPre((current) => (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]));

  const chipClass = (selected: boolean) =>
    clsx(
      'rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
      selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-sand-300 bg-surface text-ink-700 hover:border-brand-600',
    );

  const step = steps[stepIndex];

  return (
    <section ref={sectionRef} aria-label={t('practiceSession.inProgress')} className="scroll-mt-24" data-testid="practice-session">
      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-sand-200 bg-sand-50 px-5 py-8 text-center">
          <Button size="lg" onClick={begin} className="min-w-[12rem] gap-3 text-lg" data-testid="practice-begin">
            <span aria-hidden="true">▶</span> {t('practiceSession.begin')}
          </Button>
        </div>
      )}

      {phase === 'before' && (
        <div className="flex flex-col gap-4 rounded-2xl border border-sand-200 bg-surface p-5 sm:p-8">
          <h2 ref={panelHeading} tabIndex={-1} className="font-serif text-2xl text-ink-900 outline-none sm:text-3xl">
            {t('practiceSession.beforeTitle')}
          </h2>
          <p className="text-ink-700">{t('practiceSession.beforeLead')}</p>
          <div role="group" aria-label={t('practiceSession.beforeLead')} className="flex flex-wrap gap-2">
            {PRE_FEELINGS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={pre.includes(value)}
                onClick={() => togglePre(value)}
                className={chipClass(pre.includes(value))}
              >
                {t(`practiceSession.pre.${value}` as const)}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-500">{t('practiceSession.beforeHint')}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button size="lg" onClick={startPractice}>
              <span aria-hidden="true">▶</span> {t('practiceSession.begin')}
            </Button>
            <Button variant="ghost" size="lg" onClick={exit}>
              {t('practiceSession.exit')}
            </Button>
          </div>
        </div>
      )}

      {phase === 'active' && (
        <div className="flex min-h-[22rem] flex-col gap-6 rounded-2xl bg-night p-5 text-[#f4f0e8] sm:p-10" data-testid="practice-mode">
          <div className="flex items-center justify-between gap-3">
            <h2 ref={panelHeading} tabIndex={-1} className="text-sm font-semibold uppercase tracking-wide text-[#aab39c] outline-none">
              {t('practiceSession.inProgress')}
            </h2>
            {/* Not a live region — announcing every second would drown out
                the instructions for screen-reader users. */}
            <span role="timer" aria-label={t('practiceSession.elapsed')} className="font-mono text-2xl tabular-nums sm:text-3xl">
              {formatClock(elapsed)}
            </span>
          </div>

          {step && (
            <div className="flex flex-1 flex-col justify-center gap-3" aria-live="polite">
              <p className="text-sm text-[#d9c7a7]">
                {t('practiceSession.stepOf', { current: stepIndex + 1, total: steps.length })}
                {step.label ? ` · ${step.label}` : ''}
              </p>
              <p className="text-xl leading-relaxed sm:text-2xl">{step.text}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {stepIndex > 0 && (
              <Button variant="inverse-ghost" onClick={() => setStepIndex((i) => i - 1)}>
                ← {t('practiceSession.previous')}
              </Button>
            )}
            {stepIndex < steps.length - 1 ? (
              <Button variant="inverse" onClick={() => setStepIndex((i) => i + 1)}>
                {t('practiceSession.next')} →
              </Button>
            ) : (
              <Button variant="inverse" onClick={finish} loading={saving} data-testid="practice-finish">
                {t('practiceSession.finish')}
              </Button>
            )}
            {stepIndex < steps.length - 1 && (
              <Button variant="inverse-ghost" onClick={finish}>
                {t('practiceSession.finish')}
              </Button>
            )}
            <button
              type="button"
              onClick={exit}
              className="ml-auto text-sm text-[#d9c7a7] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f4f0e8]"
            >
              {t('practiceSession.exit')}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm text-[#f0c9b6]">
              {t('practiceSession.saveError')}
            </p>
          )}
        </div>
      )}

      {phase === 'after' && (
        <div className="flex flex-col gap-4 rounded-2xl border border-sand-200 bg-surface p-5 sm:p-8">
          <h2 ref={panelHeading} tabIndex={-1} className="font-serif text-2xl text-ink-900 outline-none sm:text-3xl">
            {t('practiceSession.afterTitle')}
          </h2>
          <p className="text-ink-700">{t('practiceSession.afterLead')}</p>
          <div role="group" aria-label={t('practiceSession.afterLead')} className="flex flex-wrap gap-2">
            {POST_FEELINGS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={post === value}
                onClick={() => setPost((current) => (current === value ? undefined : value))}
                className={chipClass(post === value)}
              >
                {t(`practiceSession.post.${value}` as const)}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`notice-${practiceSlug}`} className="text-sm font-medium text-ink-900">
              {t('practiceSession.noticeLabel')} <span className="font-normal text-ink-500">({t('practiceSession.noticeOptional')})</span>
            </label>
            <Textarea
              id={`notice-${practiceSlug}`}
              value={note}
              maxLength={REFLECTION_NOTE_MAX}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
            />
            <p className="text-xs text-ink-500">{t('practiceSession.noticePrivate')}</p>
          </div>
          {error && (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {t('practiceSession.saveError')}
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={() => save(true)} loading={saving} data-testid="practice-save">
              {t('practiceSession.save')}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => save(false)} disabled={saving}>
              {t('practiceSession.skip')}
            </Button>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="flex flex-col gap-3 rounded-2xl border border-sand-200 bg-brand-tint p-5 sm:p-8" data-testid="practice-complete">
          <h2 ref={panelHeading} tabIndex={-1} className="font-serif text-2xl text-ink-900 outline-none sm:text-3xl">
            {t('practiceSession.completeTitle')}
          </h2>
          <p className="text-lg text-ink-700">{t('practiceSession.completeLead')}</p>
          {!signedIn && (
            <div className="flex flex-col gap-2 border-t border-sand-200 pt-3 text-sm text-ink-700">
              <p>
                {t('practiceSession.savedOnDevice')} {t('practiceSession.accountInvite')}
              </p>
              <Link href="/register" className="w-fit font-medium text-link hover:underline">
                {t('practiceSession.createAccount')} →
              </Link>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
            <Link href="/practices" className="font-medium text-link hover:underline">
              {t('practiceSession.nextQuestion')} →
            </Link>
            {signedIn && (
              <Link href="/journey" className="font-medium text-link hover:underline">
                {t('practiceSession.viewJourney')}
              </Link>
            )}
            <button type="button" onClick={begin} className="text-sm text-ink-500 underline-offset-2 hover:underline">
              {t('practiceSession.practiceAgain')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
