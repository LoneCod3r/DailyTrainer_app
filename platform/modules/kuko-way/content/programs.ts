import type { Program } from '../types';

// Only the program shell is defined — the source material never assigns
// specific practices to specific days, so day-by-day sequences are
// intentionally NOT modeled here (see modules/kuko-way/service.ts).
export const programs: Program[] = [
  {
    length: 7,
    slug: '7-days',
    title: { bg: 'Програма за 7 дни' },
    description: { bg: 'Кратко, фокусирано въведение в ежедневната практика.' },
  },
  {
    length: 14,
    slug: '14-days',
    title: { bg: 'Програма за 14 дни' },
    description: { bg: 'Две седмици за изграждане на устойчив навик.' },
  },
  {
    length: 28,
    slug: '28-days',
    title: { bg: 'Програма за 28 дни' },
    description: { bg: 'По-дълбока месечна практика за трайна промяна.' },
  },
];
