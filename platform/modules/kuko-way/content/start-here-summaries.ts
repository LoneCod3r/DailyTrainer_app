import type { LocalizedText } from '../types';
import type { START_HERE_SECTION_IDS } from '../handbook';

// Website-only summaries for the Start Here listing — editorial interface
// copy, NOT handbook text. They were written for the site and approved by the
// client; none of this wording exists in the source documents, and the
// chapters themselves (./start-here.ts, transcribed verbatim) are unchanged.
// Shown only on the Start Here index; the chapter pages show the full text.
// Informal "ти" voice, as in the surrounding interface copy.
// Deliberately neutral on the open editorial questions (the "маневри"
// terminology, the origin story, the emotional-experiences wording).
export const startHereSummaries: Record<(typeof START_HERE_SECTION_IDS)[number], LocalizedText> = {
  intro: {
    bg: 'Какво включва наръчникът — движения и прости препоръки за всеки ден — и какво ще ти даде: нов поглед към тялото и инструменти за по-добра подвижност.',
    en: 'What the guide includes — movements and simple recommendations for every day — and what it will give you: a new perspective on the body and tools for better mobility.',
  },
  'what-is-kuko-way': {
    bg: 'Подход и общност, в които поемаш по-активна роля в грижата за себе си — и идеята, че съвременният начин на живот често поставя тялото под постоянно натоварване.',
    en: 'An approach and a community in which you take a more active role in caring for yourself — and the idea that modern life often places the body under constant strain.',
  },
  'our-beliefs': {
    bg: 'Осемте убеждения, на които стъпва KUKO WAY — от естествената способност на тялото да се възстановява до това, че силата за промяна е твоя.',
    en: 'The eight beliefs KUKO WAY is built on — from the body’s natural ability to recover to the idea that the power to change is yours.',
  },
  'fascia-fundamentals': {
    bg: 'Седем теми от практиката: намерение, фиксиране и заключване, контра-ротация, бавно движение, дишане, ходене и наблюдение.',
    en: 'Seven topics from the practice: intention, fixing and locking, counter-rotation, slow movement, breathing, walking, and observation.',
  },
  'getting-started-tips': {
    bg: 'Гръбначно-тазово заключване, етапно дишане, наблюдение между движенията и какво да правиш при замайване.',
    en: 'The spinal-pelvic lock, step breathing, observing your body between movements, and what to do if you feel dizzy.',
  },
  'what-to-expect': {
    bg: 'Какво може да усетиш по време на практиката и след нея, кога е по-добре да спреш и как да я адаптираш при ограничена подвижност.',
    en: 'What you may feel during and after the practice, when it is better to stop, and how to adapt it if your mobility is limited.',
  },
};
