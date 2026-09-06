// KUKO WAY content model. Source: KUKO_WAY_Fascial_Maneuvers_BG.docx (the
// approved handbook). Content is Bulgarian-first — `en` fields are only
// populated once an approved translation exists (Prompt2 Day 2 spec: do not
// machine-translate the handbook). Never invent values for optional fields
// such as duration or benefits when the source doesn't provide them.
import type { Locale } from '@/lib/i18n/locale';

export type LocalizedText = {
  bg: string;
  en?: string;
};

export function localize(text: LocalizedText | undefined, locale: Locale): { value: string; isFallback: boolean } {
  if (!text) return { value: '', isFallback: false };
  if (locale === 'en' && text.en) return { value: text.en, isFallback: false };
  return { value: text.bg, isFallback: locale === 'en' };
}

export type PracticeCategory = 'reset' | 'full-body' | 'organ-reset' | 'closing';

export interface InstructionGroup {
  // `label` distinguishes bilateral sequences ("Част 1" / "Част 2") — omitted
  // when a practice has a single unbroken sequence.
  label?: LocalizedText;
  steps: LocalizedText[];
}

export interface Practice {
  id: string;
  slug: string;
  category: PracticeCategory;
  order: number;
  title: LocalizedText;
  summary?: LocalizedText;
  intro?: LocalizedText[];
  benefits?: LocalizedText[];
  instructions?: InstructionGroup[];
  safetyNote?: LocalizedText;
  parentId?: string;
  childIds?: string[];
}

export interface StartHereSubsection {
  title: LocalizedText;
  paragraphs: LocalizedText[];
}

export interface StartHereSection {
  id: string;
  slug: string;
  order: number;
  title: LocalizedText;
  paragraphs?: LocalizedText[];
  subsections?: StartHereSubsection[];
}

export type ProgramLength = 7 | 14 | 28;

export interface ProgramDay {
  day: number;
}

export interface Program {
  length: ProgramLength;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
}

// External YouTube content (KUKO WAY's own channel), embedded rather than
// hosted — not part of the handbook, so titles are the real video titles as
// published, not handbook transcriptions.
export interface FreeVideo {
  id: string;
  youtubeId: string;
  order: number;
  title: LocalizedText;
}
