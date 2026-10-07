'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n/LocaleProvider';

// Marks one program item done via the progress API (which re-checks access
// and the day's unlock server-side), then refreshes the server-rendered day
// so completion/unlock state always comes from the server, never the client.
export function ItemDoneButton({ programSlug, itemId, done }: { programSlug: string; itemId: string; done: boolean }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [refreshing, startTransition] = useTransition();

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-link" data-testid="item-done">
        <span aria-hidden="true">✓</span> {t('resetPrograms.done')}
      </span>
    );
  }

  async function complete() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(
        `/api/programs/${encodeURIComponent(programSlug)}/items/${encodeURIComponent(itemId)}/complete`,
        { method: 'POST' },
      );
      if (!res.ok) throw new Error(String(res.status));
      startTransition(() => router.refresh());
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Button variant="secondary" size="sm" onClick={complete} loading={busy || refreshing} data-testid="item-mark-done">
        {t('resetPrograms.markDone')}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300">
          {t('resetPrograms.actionError')}
        </p>
      )}
    </div>
  );
}
