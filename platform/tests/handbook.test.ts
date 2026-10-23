import { describe, it, expect } from 'vitest';
import { getHandbookSections, getLearnSections, getStartHereSections } from '@/modules/kuko-way/service';
import { handbookSectionHref, LEARN_SECTION_IDS, START_HERE_PHASES, START_HERE_SECTION_IDS } from '@/modules/kuko-way/handbook';

// Start Here (orientation / first steps) and Learn (understanding /
// reference) must never list the same handbook chapter — and no chapter may
// be dropped by the split.
describe('handbook chapter ownership', () => {
  const all = getHandbookSections().map((s) => s.id);

  it('gives every handbook chapter exactly one home', () => {
    const owned = [...START_HERE_SECTION_IDS, ...LEARN_SECTION_IDS];
    expect(new Set(owned).size).toBe(owned.length); // no chapter in both
    expect([...owned].sort()).toEqual([...all].sort()); // none missing, none unknown
  });

  it('Start Here and Learn list disjoint chapters', () => {
    const startHere = new Set(getStartHereSections().map((s) => s.id));
    const learn = getLearnSections().map((s) => s.id);
    expect(learn.filter((id) => startHere.has(id))).toEqual([]);
    expect(startHere.size + learn.length).toBe(all.length);
  });

  it('Start Here phases cover exactly its own chapters, once each', () => {
    const phased = START_HERE_PHASES.flatMap((p) => p.sectionIds);
    expect(phased).toEqual([...START_HERE_SECTION_IDS]);
  });

  it('gives every Start Here chapter a website-only summary in both languages, never handbook text', () => {
    const handbookText = getHandbookSections().flatMap((s) => [
      ...(s.paragraphs ?? []),
      ...(s.subsections ?? []).flatMap((sub) => sub.paragraphs),
    ]);
    for (const s of getStartHereSections()) {
      expect(s.summary?.bg).toBeTruthy();
      expect(s.summary?.en).toBeTruthy();
      expect(handbookText.some((p) => p.bg === s.summary!.bg || p.en === s.summary!.en)).toBe(false);
    }
    // Summaries belong to the Start Here listing only — never to the
    // handbook chapters themselves or to Learn.
    expect(getHandbookSections().some((s) => s.summary)).toBe(false);
    expect(getLearnSections().some((s) => s.summary)).toBe(false);
  });

  it('links each chapter to its owning page only', () => {
    for (const s of getStartHereSections()) expect(handbookSectionHref(s)).toBe(`/practices/start-here/${s.slug}`);
    for (const s of getLearnSections()) expect(handbookSectionHref(s)).toBe(`/learn/${s.slug}`);
  });
});
