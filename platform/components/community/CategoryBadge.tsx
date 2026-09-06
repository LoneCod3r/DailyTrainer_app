import { Badge } from '@/components/ui';
import type { DiscussionCategory } from '@prisma/client';
import type { DictKey } from '@/lib/i18n/dictionaries';

const CATEGORY_KEY: Record<DiscussionCategory, DictKey> = {
  GENERAL: 'discussions.categoryGeneral',
  PRACTICES: 'discussions.categoryPractices',
  PROGRAMS: 'discussions.categoryPrograms',
  KUKO_WAY: 'discussions.categoryKukoWay',
  COMMUNITY: 'discussions.categoryCommunity',
  QUESTIONS: 'discussions.categoryQuestions',
};

export function CategoryBadge({
  category,
  t,
  className,
}: {
  category: DiscussionCategory;
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  className?: string;
}) {
  return (
    <Badge tone="brand" className={className}>
      {t(CATEGORY_KEY[category])}
    </Badge>
  );
}
