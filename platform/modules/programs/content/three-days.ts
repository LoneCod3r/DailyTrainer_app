import type { ResetProgram } from '../types';
import { placeholderDays, placeholderDocuments } from './placeholders';

// 3 Day Reset — "short restart" (client chat: 6–7 videos + 3 text files).
// The video-to-day mapping is not known yet, so each day holds one
// CONTENT REQUIRED placeholder.
export const threeDayReset: ResetProgram = {
  slug: '3-days',
  order: 2,
  lengthDays: 3,
  title: { bg: '3 Day Reset', en: '3 Day Reset' },
  documents: placeholderDocuments(),
  introItems: [],
  phases: [{ key: 'days', title: { bg: '3 Day Reset', en: '3 Day Reset' }, days: placeholderDays('3d', 1, 3) }],
  published: false,
};
