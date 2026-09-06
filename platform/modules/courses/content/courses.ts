// Demo/seed course content — clearly not the KUKO WAY handbook (which stays
// in modules/kuko-way, untouched). Written directly in both languages
// (not machine-translated) as generic practice-education content so the
// Course → Module → Lesson experience has something real to show.
import type { Course } from '../types';

export const courses: Course[] = [
  {
    slug: 'foundations-of-practice',
    title: { bg: 'Основи на практиката', en: 'Foundations of Practice' },
    description: {
      bg: 'Кратък структуриран курс за това как да изградиш устойчив ежедневен навик за практика.',
      en: 'A short structured course on building a daily practice habit that actually sticks.',
    },
    modules: [
      {
        slug: 'getting-grounded',
        order: 1,
        title: { bg: 'Първи стъпки', en: 'Getting Grounded' },
        description: {
          bg: 'Основните понятия, преди да започнеш редовна практика.',
          en: 'The basic ideas to understand before starting a regular practice.',
        },
        lessons: [
          {
            slug: 'why-consistency-matters',
            order: 1,
            title: { bg: 'Защо постоянството е важно', en: 'Why Consistency Matters' },
            summary: {
              bg: 'Кратки, редовни практики обикновено дават по-трайни резултати от редки дълги сесии.',
              en: 'Short, regular practice tends to build more lasting results than occasional long sessions.',
            },
            content: [
              {
                bg: 'Тялото реагира най-добре на повтарящи се, предвидими сигнали. Няколко минути на ден изграждат навик по-надеждно от една дълга сесия веднъж седмично.',
                en: 'The body responds best to repeated, predictable input. A few minutes a day builds a habit more reliably than one long session once a week.',
              },
              {
                bg: 'Целта на този курс не е съвършенство, а последователност — малки стъпки, които можеш да повтаряш.',
                en: "This course isn't about perfection — it's about consistency: small steps you can actually repeat.",
              },
            ],
          },
          {
            slug: 'choosing-your-time',
            order: 2,
            title: { bg: 'Избери своето време', en: 'Choosing Your Time' },
            content: [
              {
                bg: 'Избери момент от деня, в който е малко вероятно да бъдеш прекъсван — дори да са само 5 минути.',
                en: "Pick a moment in your day when you're unlikely to be interrupted — even if it's only 5 minutes.",
              },
              {
                bg: 'Свържи практиката с нещо, което вече правиш всеки ден (например след събуждане или преди сън), за да я запомниш по-лесно.',
                en: 'Anchor the practice to something you already do daily (like waking up or going to bed) so it is easier to remember.',
              },
            ],
          },
          {
            slug: 'tracking-progress',
            order: 3,
            title: { bg: 'Проследяване на напредъка', en: 'Tracking Progress' },
            content: [
              {
                bg: 'Не е нужно сложно проследяване — достатъчно е да отбелязваш кои уроци и практики си завършил.',
                en: "You don't need complicated tracking — simply noting which lessons and practices you've completed is enough.",
              },
            ],
          },
        ],
      },
      {
        slug: 'building-consistency',
        order: 2,
        title: { bg: 'Изграждане на постоянство', en: 'Building Consistency' },
        lessons: [
          {
            slug: 'starting-small',
            order: 1,
            title: { bg: 'Започни малко', en: 'Starting Small' },
            content: [
              {
                bg: 'По-добре е да практикуваш 3 минути всеки ден, отколкото да планираш 30 минути и да пропускаш дни.',
                en: "It's better to practice 3 minutes every day than to plan 30 minutes and skip days.",
              },
            ],
          },
          {
            slug: 'handling-missed-days',
            order: 2,
            title: { bg: 'Когато пропуснеш ден', en: 'Handling Missed Days' },
            content: [
              {
                bg: 'Пропуснат ден не разваля прогреса. Просто се върни към практиката на следващия ден, без самокритика.',
                en: 'A missed day does not undo your progress. Simply return to the practice the next day, without self-criticism.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: 'breath-and-movement-basics',
    title: { bg: 'Основи на дишането и движението', en: 'Breath & Movement Basics' },
    description: {
      bg: 'Въведение в съзнателното дишане и леко движение като допълнение към твоята практика.',
      en: 'An introduction to mindful breathing and gentle movement as a complement to your practice.',
    },
    modules: [
      {
        slug: 'breath-fundamentals',
        order: 1,
        title: { bg: 'Основи на дишането', en: 'Breath Fundamentals' },
        lessons: [
          {
            slug: 'noticing-your-breath',
            order: 1,
            title: { bg: 'Забелязване на дишането', en: 'Noticing Your Breath' },
            content: [
              {
                bg: 'Преди да променяш дишането си, отдели минута само да го наблюдаваш, без да го контролираш.',
                en: 'Before changing your breath, spend a minute simply observing it without controlling it.',
              },
            ],
          },
          {
            slug: 'slow-exhale',
            order: 2,
            title: { bg: 'По-бавно издишване', en: 'The Slower Exhale' },
            content: [
              {
                bg: 'Издишване, по-дълго от вдишването, е прост начин да поканиш тялото към по-спокойно състояние.',
                en: 'An exhale that is longer than your inhale is a simple way to invite the body toward a calmer state.',
              },
            ],
          },
        ],
      },
      {
        slug: 'gentle-movement',
        order: 2,
        title: { bg: 'Леко движение', en: 'Gentle Movement' },
        lessons: [
          {
            slug: 'movement-as-a-check-in',
            order: 1,
            title: { bg: 'Движението като проверка', en: 'Movement as a Check-In' },
            content: [
              {
                bg: 'Кратко, леко движение сутрин е добър начин да усетиш къде тялото ти носи напрежение днес.',
                en: 'A short, gentle movement session in the morning is a good way to notice where your body is holding tension today.',
              },
            ],
          },
          {
            slug: 'pairing-with-practice',
            order: 2,
            title: { bg: 'Комбиниране с практиката', en: 'Pairing With Your Practice' },
            content: [
              {
                bg: 'Леко движение преди практика от Библиотеката може да помогне на тялото ти да е по-подготвено.',
                en: 'A little gentle movement before a practice from the Library can help your body feel more prepared.',
              },
            ],
          },
        ],
      },
    ],
  },
];
