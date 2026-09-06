import type { Program } from '../types';

// Only the program shell is defined — the source material never assigns
// specific practices to specific days, so day-by-day sequences are
// intentionally NOT modeled here (see modules/kuko-way/service.ts). These
// titles/descriptions aren't covered by either handbook docx, so the English
// text here is a direct translation rather than a transcription.
export const programs: Program[] = [
  {
    length: 7,
    slug: '7-days',
    title: { bg: 'Програма за 7 дни', en: '7-Day Program' },
    description: {
      bg: 'Кратко, фокусирано въведение в ежедневната практика.',
      en: 'A short, focused introduction to the daily practice.',
    },
  },
  {
    length: 14,
    slug: '14-days',
    title: { bg: 'Програма за 14 дни', en: '14-Day Program' },
    description: {
      bg: 'Две седмици за изграждане на устойчив навик.',
      en: 'Two weeks to build a lasting habit.',
    },
  },
  {
    length: 28,
    slug: '28-days',
    title: { bg: 'Програма за 28 дни', en: '28-Day Program' },
    description: {
      bg: 'По-дълбока месечна практика за трайна промяна.',
      en: 'A deeper month-long practice for lasting change.',
    },
  },
];
