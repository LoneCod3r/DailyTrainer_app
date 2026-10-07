import type { ResetProgram } from '../types';
import { placeholderDays, placeholderDocuments } from './placeholders';

// 7 Day Reset — "core short course" (client chat: 10 videos + texts of a
// similar volume). The video-to-day mapping is not known yet, so each day
// holds one CONTENT REQUIRED placeholder.
export const sevenDayReset: ResetProgram = {
  slug: '7-days',
  order: 3,
  lengthDays: 7,
  title: { bg: '7 Day Reset', en: '7 Day Reset' },
  documents: placeholderDocuments(),
  introItems: [],
  phases: [{ key: 'days', title: { bg: '7 Day Reset', en: '7 Day Reset' }, days: placeholderDays('7d', 1, 7) }],
  published: false,
};
