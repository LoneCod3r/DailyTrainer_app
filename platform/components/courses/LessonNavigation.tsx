'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Alert } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

// Persists completion via /api/courses/[slug]/progress (real, per-user
// LessonProgress rows — see modules/courses/progress.service.ts). Not a
// localStorage-only toggle like Day 2's MarkCompleteButton, since Day 3
// explicitly asks for real course progress tracking.
export function LessonNavigation({
  courseSlug,
  moduleSlug,
  lessonSlug,
  completed,
  isSignedIn,
  previousHref,
  nextHref,
}: {
  courseSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  completed: boolean;
  isSignedIn: boolean;
  previousHref?: string;
  nextHref?: string;
}) {
  const t = useT();
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(completed);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function markComplete() {
    setSaving(true);
    setError(false);
    const res = await fetch(`/api/courses/${courseSlug}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleSlug, lessonSlug }),
    });
    setSaving(false);
    if (!res.ok) {
      setError(true);
      return;
    }
    setIsComplete(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 border-t border-sand-200 pt-6">
      {!isSignedIn && (
        <Alert tone="info">
          <Link href="/login" className="font-medium underline">
            {t('discussions.loginCta')}
          </Link>
        </Alert>
      )}
      {error && <Alert tone="danger">{t('discussions.submitError')}</Alert>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {previousHref ? (
            <Link href={previousHref} className="text-sm font-medium text-link hover:underline">
              ← {t('courses.lessonPrevious')}
            </Link>
          ) : (
            <span />
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isComplete ? (
            <Button onClick={markComplete} loading={saving} disabled={!isSignedIn}>
              {t('courses.lessonMarkComplete')}
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              ✓ {t('courses.lessonCompleted')}
            </Button>
          )}

          {nextHref && (
            <Link href={nextHref}>
              <Button variant={isComplete ? 'primary' : 'secondary'}>{t('courses.lessonNext')} →</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
