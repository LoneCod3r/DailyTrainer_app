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
  {
    id: 'born-by-c-section',
    youtubeId: 'o5tppe_Le1Q',
    order: 4,
    title: {
      bg: 'Родени Сте Със СЕКЦИО? Това Упражнение Ще Промени Живота Ви',
      en: 'Born by C-SECTION? This Exercise Will Change Your Life',
    },
  },
  {
    id: 'natural-facelift',
    youtubeId: 'D06Q-BJGzLc',
    order: 5,
    title: {
      bg: 'Как Да Си Направиш ЕСТЕСТВЕН Фейслифт (Без Ботокс)',
      en: 'How to Give Yourself a NATURAL Facelift (Without Botox)',
    },
  },
  {
    id: 'vagus-7-minutes',
    youtubeId: 'NOSfRx606Nw',
    order: 6,
    title: {
      bg: 'Освободи Се От Умората И Напрежението За 7 Минути | Регулирай ВАГУСА',
      en: 'Release Fatigue and Tension in 7 Minutes | Regulate the VAGUS Nerve',
    },
  },
  {
    id: 'unexpressed-emotions',
    youtubeId: 'nLJyEGIcNNs',
    order: 7,
    title: {
      bg: 'Тайната На Тялото: Как Неизразените Емоции Водят До Хронични Болести',
      en: "The Body's Secret: How Unexpressed Emotions Lead to Chronic Illness",
    },
  },
  {
    id: 'morning-detox-hydration',
    youtubeId: 'b7d2vLduuZc',
    order: 8,
    title: {
      bg: 'Сутрешен Ритуал За ДЕТОКС и Пълна ХИДРАТАЦИЯ',
      en: 'Morning Ritual for DETOX and Full HYDRATION',
    },
  },
  {
    id: 'reset-your-body',
    youtubeId: 'O6glEQHMW-w',
    order: 9,
    title: {
      bg: 'Как Напълно Да "РЕСТАРТИРАШ" Тялото Си (Лесна рутина)',
      en: 'How to Fully "RESET" Your Body (Easy Routine)',
    },
  },
];
