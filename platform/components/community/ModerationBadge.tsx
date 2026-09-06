import { Badge } from '@/components/ui';
import type { ModerationStatus } from '@prisma/client';
import type { DictKey } from '@/lib/i18n/dictionaries';

// Only PENDING/HIDDEN ever reach this component — PUBLISHED needs no badge,
// and REMOVED is never rendered (see discussions.service.ts canView).
export function ModerationBadge({
  status,
  t,
}: {
  status: Exclude<ModerationStatus, 'PUBLISHED' | 'REMOVED'>;
  t: (key: DictKey) => string;
}) {
  const tone = status === 'PENDING' ? 'warning' : 'danger';
  const labelKey: DictKey = status === 'PENDING' ? 'discussions.moderationPending' : 'discussions.moderationHidden';
  return <Badge tone={tone}>{t(labelKey)}</Badge>;
}

export function LockedBadge({ t }: { t: (key: DictKey) => string }) {
  return <Badge tone="neutral">{t('discussions.lockedTitle')}</Badge>;
}
