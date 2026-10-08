'use client';

import { useT } from '@/lib/i18n/LocaleProvider';
import { useProgressSummary } from '@/lib/progress/client';

// Real practice numbers via the hybrid progress facade (lib/progress/client.ts):
// account-wide for signed-in users, this device only for visitors. Reads as
// zeros until loaded so it never flashes a stale or invented value. Minutes
// are shown only when measured on the account (the practice timer).
//
// `inline` (default) renders bare stat blocks for the parent to lay out
// (Home, Account). `cards` renders each stat as its own card, for a grid of
// stat cards (Journey). Either way the value is each block's first <p>.
export function YourProgressStats({
  showMinutes = false,
  variant = 'inline',
}: {
  showMinutes?: boolean;
  variant?: 'inline' | 'cards';
}) {
  const t = useT();
  const { summary } = useProgressSummary();
  const cards = variant === 'cards';
  const blockClass = cards ? 'flex flex-col gap-1 rounded-2xl border border-sand-200 bg-surface p-4 shadow-card' : undefined;

  return (
    <>
      <div data-testid="streak-stat" className={blockClass}>
        <p className="text-2xl font-semibold text-ink-900 sm:text-3xl">{summary.streakDays}</p>
        <p className="text-sm text-ink-500">{t('journey.streak')}</p>
      </div>
      <div data-testid="practices-completed-stat" className={blockClass}>
        <p className="text-2xl font-semibold text-ink-900 sm:text-3xl">{summary.sessionsCompleted}</p>
        <p className="text-sm text-ink-500">{t('journey.sessions')}</p>
      </div>
      {showMinutes && summary.totalMinutes !== null && (
        <div data-testid="minutes-stat" className={blockClass}>
          <p className="text-2xl font-semibold text-ink-900 sm:text-3xl">{summary.totalMinutes}</p>
          <p className="text-sm text-ink-500">{t('journey.minutes')}</p>
        </div>
      )}
    </>
  );
}
