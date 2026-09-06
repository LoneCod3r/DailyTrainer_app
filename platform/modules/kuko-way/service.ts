import { practices } from './content/practices';
import { startHereSections } from './content/start-here';
import { programs } from './content/programs';
import type { Practice, Program, StartHereSection } from './types';

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

export function getStartHereSections(): StartHereSection[] {
  return [...startHereSections].sort((a, b) => a.order - b.order);
}

export function getStartHereSectionBySlug(slug: string): StartHereSection | undefined {
  return startHereSections.find((s) => s.slug === slug);
}

export function getPrograms(): Program[] {
  return programs;
}

export function getProgramBySlug(slug: string): Program | undefined {
  return programs.find((p) => p.slug === slug);
}

// The handbook explicitly states these three form a ~15-minute "tension
// reset" — used to seed the Home "Today's practice" recommendation.
export const TENSION_RESET_IDS = ['palate-slide', 'full-twist', 'anti-gravity'];

export function getTensionResetPractices(): Practice[] {
  return TENSION_RESET_IDS.map((id) => getPracticeById(id)).filter((p): p is Practice => Boolean(p));
}
