import type { ProgramDay, ProgramDocument, ProgramItem } from '../types';

// Shared builders for placeholder program content. Every item they create is
// `contentRequired` — a slot for the client's material (videos, audio, texts
// delivered via Google Drive), never invented content.

export function placeholderDocuments(): ProgramDocument[] {
  // "2–3 text files: description, what to expect, guidance" (client chat).
  return [{ key: 'DESCRIPTION' }, { key: 'WHAT_TO_EXPECT' }, { key: 'GUIDANCE' }];
}

export function placeholderVideo(id: string, extra: Partial<ProgramItem> = {}): ProgramItem {
  return { id, kind: 'VIDEO', required: true, contentRequired: true, ...extra };
}

// One required placeholder per day until the client maps their videos and
// texts to days (how e.g. the 28 Day Reset's 31 videos spread over 28 days is
// an open content question).
export function placeholderDays(programKey: string, from: number, to: number): ProgramDay[] {
  const days: ProgramDay[] = [];
  for (let day = from; day <= to; day++) {
    days.push({ day, items: [placeholderVideo(`${programKey}-d${String(day).padStart(2, '0')}-1`)] });
  }
  return days;
}
