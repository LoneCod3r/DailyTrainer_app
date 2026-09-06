import type { FreeVideo } from '../types';

// KUKO WAY's own YouTube channel (youtube.com/@AleksandarKuko) — embedded
// directly rather than hosted. `bg` titles are the real published video
// titles (fetched via YouTube's oEmbed endpoint); `en` is a direct
// translation of those short titles (not sourced from any approved
// document, same basis as the program titles in programs.ts).
export const freeVideos: FreeVideo[] = [
  {
    id: 'stress-blocks-organs',
    youtubeId: '3FtN_xW-qDg',
    order: 1,
    title: {
      bg: 'СТРЕСЪТ Блокира Органите ти (Рестартирай ги за 16 минути)',
      en: 'STRESS Blocks Your Organs (Reset Them in 16 Minutes)',
    },
  },
  {
    id: 'wake-up-8-minutes',
    youtubeId: 'CoAToeX8z8c',
    order: 2,
    title: {
      bg: 'Как да се Събудите за 8 минути (БЕЗ Кафе)',
      en: 'How to Wake Up in 8 Minutes (WITHOUT Coffee)',
    },
  },
  {
    id: '15-minutes-a-day',
    youtubeId: 'VDyDyBqiHF4',
    order: 3,
    title: {
      bg: '15 Минути на Ден, Които Ще ПРОМЕНЯТ Тялото Ти Завинаги',
      en: '15 Minutes a Day That Will CHANGE Your Body Forever',
    },
  },
];
