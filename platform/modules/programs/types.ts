// Reset Programs content model (V1 decision document §2):
//   Program → Phase → Day → Item, plus program-level documents and optional
//   "before you begin" intro items.
// Content is static (./content/*.ts), like the practice handbook in
// modules/kuko-way. Only user state (access, progress, reflections) lives in
// the database. Media is referenced by asset id, never by URL — a paid video
// must only ever be resolved server-side, behind an access check.
//
// Nothing here may be invented: anything the client hasn't supplied yet is
// marked `contentRequired` and rendered as "content coming soon".
import type { LocalizedText } from '@/modules/kuko-way/types';

export type { LocalizedText };

export type ProgramItemKind = 'VIDEO' | 'AUDIO' | 'TEXT' | 'PRACTICE';
export type DaySlot = 'MORNING' | 'DAY' | 'EVENING';

export interface ProgramItem {
  // Stable forever — progress rows reference it. Never rename or reuse.
  id: string;
  kind: ProgramItemKind;
  slot?: DaySlot;
  title?: LocalizedText;
  // Measured length of the media, once known. Never estimated.
  durationSec?: number;
  // Required items must be done for the day to count as complete.
  required: boolean;
  // VIDEO/AUDIO: provider-agnostic asset id (resolved server-side later).
  mediaAssetId?: string;
  // TEXT: paragraphs.
  body?: LocalizedText[];
  // PRACTICE: a handbook practice from modules/kuko-way.
  practiceSlug?: string;
  // Placeholder until the client's material is mapped in.
  contentRequired?: true;
}

export interface ProgramDay {
  day: number;
  title?: LocalizedText;
  items: ProgramItem[];
  // The day's NOTICE prompt (concept §23); a generic prompt is used if absent.
  reflectionPrompt?: LocalizedText;
}

export interface ProgramPhase {
  key: string;
  title: LocalizedText;
  summary?: LocalizedText;
  days: ProgramDay[];
}

export type ProgramDocumentKey = 'DESCRIPTION' | 'WHAT_TO_EXPECT' | 'GUIDANCE';

export interface ProgramDocument {
  key: ProgramDocumentKey;
  // Undefined until supplied (CONTENT REQUIRED).
  body?: LocalizedText[];
}

export interface ResetProgram {
  slug: string;
  order: number;
  lengthDays: number;
  title: LocalizedText;
  documents: ProgramDocument[];
  introItems: ProgramItem[];
  phases: ProgramPhase[];
  // Unpublished programs are only visible in preview (lib/features.ts).
  published: boolean;
}

export type DayState = 'completed' | 'available' | 'locked';
