import { practices } from './content/practices';
import { startHereSections } from './content/start-here';
import { freeVideos } from './content/free-videos';
import type { FreeVideo, Practice, StartHereSection } from './types';
import { LEARN_SECTION_IDS, START_HERE_SECTION_IDS } from './handbook';

// Static content accessors. The KUKO WAY handbook is fixed reference
// content for Day 2 (no admin CRUD yet) — see modules/kuko-way/types.ts for
// why this stays out of Prisma for now.

export function getAllPractices(): Practice[] {
  return [...practices].sort((a, b) => a.order - b.order);
}

// Top-level practices are what Feel Better Now / Library grids show —
// organ-reset sub-items are reached from the "Рестарт на органите" detail
// page instead of cluttering the top-level grid.
export function getTopLevelPractices(): Practice[] {
  return getAllPractices().filter((p) => !p.parentId);
}

export function getPracticeBySlug(slug: string): Practice | undefined {
  return practices.find((p) => p.slug === slug);
}

export function getPracticeById(id: string): Practice | undefined {
  return practices.find((p) => p.id === id);
}

// A practice that can actually be done and recorded — it has its own steps.
// (Parent entries like "Organ Reset" are collections of sub-practices.)
export function isTrackablePractice(slug: string): boolean {
  const practice = getPracticeBySlug(slug);
  return Boolean(practice?.instructions && practice.instructions.length > 0);
}

export function getChildPractices(practice: Practice): Practice[] {
  if (!practice.childIds) return [];
  return practice.childIds
    .map((id) => getPracticeById(id))
    .filter((p): p is Practice => Boolean(p))
    .sort((a, b) => a.order - b.order);
}

export function getRelatedPractices(practice: Practice, limit = 3): Practice[] {
  return getTopLevelPractices()
    .filter((p) => p.id !== practice.id && p.category === practice.category)
    .slice(0, limit);
}

// Every handbook chapter, in handbook order (the Library's searchable
// archive). Each chapter's single home is decided in ./handbook.ts.
export function getHandbookSections(): StartHereSection[] {
  return [...startHereSections].sort((a, b) => a.order - b.order);
}

export function getHandbookSectionBySlug(slug: string): StartHereSection | undefined {
  return startHereSections.find((s) => s.slug === slug);
}

function sectionsByIds(ids: readonly string[]): StartHereSection[] {
  return ids
    .map((id) => startHereSections.find((s) => s.id === id))
    .filter((s): s is StartHereSection => Boolean(s));
}

// Start Here's own chapters (orientation and first steps), in reading order.
export function getStartHereSections(): StartHereSection[] {
  return sectionsByIds(START_HERE_SECTION_IDS);
}

export function getStartHereSectionBySlug(slug: string): StartHereSection | undefined {
  return getStartHereSections().find((s) => s.slug === slug);
}

// Learn's chapters (understanding and reference), in reading order.
export function getLearnSections(): StartHereSection[] {
  return sectionsByIds(LEARN_SECTION_IDS);
}

export function getLearnSectionBySlug(slug: string): StartHereSection | undefined {
  return getLearnSections().find((s) => s.slug === slug);
}

// The handbook explicitly states these three form a ~15-minute "tension
// reset" — used to seed the Home "Today's practice" recommendation.
export const TENSION_RESET_IDS = ['palate-slide', 'full-twist', 'anti-gravity'];

export function getTensionResetPractices(): Practice[] {
  return TENSION_RESET_IDS.map((id) => getPracticeById(id)).filter((p): p is Practice => Boolean(p));
}

export function getFreeVideos(): FreeVideo[] {
  return [...freeVideos].sort((a, b) => a.order - b.order);
}
