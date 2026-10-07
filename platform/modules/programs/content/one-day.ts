import type { ResetProgram } from '../types';
import { placeholderDocuments } from './placeholders';

// 1 Day Reset — "first experience / entry" (client chat). The day's parts
// below are the client's own list (chat: short introduction, morning
// practice, Fascial Maneuver, breathing, hydration/mineralization principles,
// daytime practice, evening reset, short video/audio, tracking). Only the
// morning/daytime/evening slots were stated; the media kind of each part is
// provisional until the material arrives — all CONTENT REQUIRED.
export const oneDayReset: ResetProgram = {
  slug: '1-day',
  order: 1,
  lengthDays: 1,
  title: { bg: '1 Day Reset', en: '1 Day Reset' },
  documents: placeholderDocuments(),
  introItems: [
    {
      id: '1d-intro',
      kind: 'TEXT',
      required: false,
      title: { bg: 'Кратко въведение', en: 'Short introduction' },
      contentRequired: true,
    },
  ],
  phases: [
    {
      key: 'day',
      title: { bg: '1 Day Reset', en: '1 Day Reset' },
      days: [
        {
          day: 1,
          items: [
            {
              id: '1d-morning-practice',
              kind: 'VIDEO',
              slot: 'MORNING',
              required: true,
              title: { bg: 'Сутрешна практика', en: 'Morning practice' },
              contentRequired: true,
            },
            {
              id: '1d-fascial-maneuver',
              kind: 'VIDEO',
              required: true,
              title: { bg: 'Фасциална маневра', en: 'Fascial Maneuver' },
              contentRequired: true,
            },
            {
              id: '1d-breathing',
              kind: 'VIDEO',
              required: true,
              title: { bg: 'Дишане', en: 'Breathing' },
              contentRequired: true,
            },
            {
              id: '1d-hydration',
              kind: 'TEXT',
              required: true,
              title: { bg: 'Принципи на хидратация и минерализация', en: 'Hydration and mineralization principles' },
              contentRequired: true,
            },
            {
              id: '1d-daytime-practice',
              kind: 'VIDEO',
              slot: 'DAY',
              required: true,
              title: { bg: 'Дневна практика', en: 'Daytime practice' },
              contentRequired: true,
            },
            {
              id: '1d-evening-reset',
              kind: 'VIDEO',
              slot: 'EVENING',
              required: true,
              title: { bg: 'Вечерен рестарт', en: 'Evening reset' },
              contentRequired: true,
            },
          ],
        },
      ],
    },
  ],
  published: false,
};
