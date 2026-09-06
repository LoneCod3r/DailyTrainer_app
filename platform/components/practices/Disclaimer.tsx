import type { DictKey } from '@/lib/i18n/dictionaries';

// Shared source disclaimer (KUKO_WAY_Fascial_Maneuvers_BG.docx, p.1) —
// visible wherever KUKO WAY educational/practice content is shown, kept
// visually quiet so it doesn't dominate the page.
export function Disclaimer({ t, className }: { t: (key: DictKey) => string; className?: string }) {
  return <p className={`text-xs leading-relaxed text-ink-300 ${className ?? ''}`}>{t('disclaimer.text')}</p>;
}
