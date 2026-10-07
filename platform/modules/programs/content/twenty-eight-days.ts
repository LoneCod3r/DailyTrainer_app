import type { ResetProgram } from '../types';
import { placeholderDays, placeholderDocuments } from './placeholders';

// 28 Day Reset — "flagship program" (client chat). The four weekly phases and
// their Bulgarian summaries are the client's own words; English summaries are
// CONTENT REQUIRED (the UI falls back to Bulgarian with a note). The 31 videos
// + 3 texts haven't been mapped to days yet, so each day holds one
// CONTENT REQUIRED placeholder.
export const twentyEightDayReset: ResetProgram = {
  slug: '28-days',
  order: 4,
  lengthDays: 28,
  title: { bg: '28 Day Reset', en: '28 Day Reset' },
  documents: placeholderDocuments(),
  introItems: [],
  phases: [
    {
      key: 'release',
      title: { bg: 'Release', en: 'Release' },
      summary: { bg: 'Освобождаване на напрежение и защитни модели.' },
      days: placeholderDays('28d', 1, 7),
    },
    {
      key: 'restore',
      title: { bg: 'Restore', en: 'Restore' },
      summary: { bg: 'Връщане на движение, дишане и циркулация.' },
      days: placeholderDays('28d', 8, 14),
    },
    {
      key: 'reconnect',
      title: { bg: 'Reconnect', en: 'Reconnect' },
      summary: { bg: 'Връзка с тялото и нервната система.' },
      days: placeholderDays('28d', 15, 21),
    },
    {
      key: 'reset',
      title: { bg: 'Reset', en: 'Reset' },
      summary: { bg: 'Изграждане на нов ежедневен ритъм.' },
      days: placeholderDays('28d', 22, 28),
    },
  ],
  published: false,
};
