// Which page owns each chapter of the beginner's handbook
// (content/start-here.ts — transcribed verbatim, never edited here). Every
// chapter has exactly one home, so nothing is listed twice:
//
//   • Start Here (/practices/start-here) — orientation and first steps: what
//     KUKO WAY is, how to practise, what to expect, then the first practice.
//   • Learn (/learn) — understanding and reference: the body and fascia
//     behind the practice, for reading at any point.
//
// The order of each list is the reading order on that page. Kept free of
// content imports so client components (the Library) can use it too.

export const START_HERE_SECTION_IDS = [
  'intro',
  'what-is-kuko-way',
  'our-beliefs',
  // "Foundations of Fascia" is practical technique — intention, fixing and
  // locking, counter-rotation, moving slowly, breathing — needed before the
  // first practice, so it belongs to the getting-started path.
  'fascia-fundamentals',
  'getting-started-tips',
  'what-to-expect',
] as const;

export const LEARN_SECTION_IDS = [
  'evolution-of-training',
  'what-is-fascia',
  'what-is-fascial-maneuver',
  'body-zones',
  'body-fundamentals',
] as const;

// Start Here groups its chapters into two short phases before the first
// practice (labels: startHere.phaseOrient / startHere.phasePrepare).
export const START_HERE_PHASES: { labelKey: 'startHere.phaseOrient' | 'startHere.phasePrepare'; sectionIds: string[] }[] = [
  { labelKey: 'startHere.phaseOrient', sectionIds: ['intro', 'what-is-kuko-way', 'our-beliefs'] },
  { labelKey: 'startHere.phasePrepare', sectionIds: ['fascia-fundamentals', 'getting-started-tips', 'what-to-expect'] },
];

export function isLearnSection(id: string): boolean {
  return (LEARN_SECTION_IDS as readonly string[]).includes(id);
}

// The one canonical URL for a handbook chapter.
export function handbookSectionHref(section: { id: string; slug: string }): string {
  return isLearnSection(section.id) ? `/learn/${section.slug}` : `/practices/start-here/${section.slug}`;
}
