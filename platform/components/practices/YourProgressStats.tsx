'use client';

import { useT } from '@/lib/i18n/LocaleProvider';
import { useProgressSummary } from '@/lib/progress/client';

// Real practice numbers via the hybrid progress facade (lib/progress/client.ts):
// account-wide for signed-in users, this device only for visitors. Reads as
// zeros until loaded so it never flashes a stale or invented value. Minutes
// are shown only when measured on the account (the practice timer).
export function YourProgressStats({ showMinutes = false }: { showMinutes?: boolean }) {
  const t = useT();
  const { summary } = useProgressSummary();

  return (
    <>
      <div data-testid="streak-stat">
        <p className="text-2xl font-semibold text-ink-900 sm:text-3xl">{summary.streakDays}</p>
        <p className="text-sm text-ink-500">{t('journey.streak')}</p>
      </div>
      <div data-testid="practices-completed-stat">
        <p className="text-2xl font-semibold text-ink-900 sm:text-3xl">{summary.sessionsCompleted}</p>
        <p className="text-sm text-ink-500">{t('journey.sessions')}</p>
      </div>
      {showMinutes && summary.totalMinutes !== null && (
        <div data-testid="minutes-stat">
          <p className="text-2xl font-semibold text-ink-900 sm:text-3xl">{summary.totalMinutes}</p>
          <p className="text-sm text-ink-500">{t('journey.minutes')}</p>
        </div>
      )}
    </>
  );
}
