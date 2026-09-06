import type { DictKey } from '@/lib/i18n/dictionaries';

// Blog categories are free-form strings on ContentItem (not an enum) so
// admins can introduce new ones without a migration — this only supplies
// nicer labels for the categories we know about today; anything else falls
// back to the raw value so the system never breaks on an unrecognized one.
const KNOWN_CATEGORY_KEYS: Record<string, DictKey> = {
  community: 'discussions.categoryCommunity',
  practices: 'discussions.categoryPractices',
  programs: 'discussions.categoryPrograms',
  'kuko-way': 'discussions.categoryKukoWay',
};

export function getCategoryLabel(category: string | null, t: (key: DictKey) => string): string | null {
  if (!category) return null;
  const key = KNOWN_CATEGORY_KEYS[category];
  return key ? t(key) : category;
}
