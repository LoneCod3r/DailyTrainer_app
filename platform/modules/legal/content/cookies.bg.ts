// Cookie Policy (Политика за бисквитките), Bulgarian: the primary version.
//
// Shortened from `03_Politika_biskvitki.docx` (folder `terms and conditions,
// privacy policy и cookie policy/`, unchanged) and checked against
// storage-inventory.ts, the list of every cookie and localStorage key the app
// really uses. As the owner asked (23.10.2026), the policy has no detailed
// list: names and durations are shown in the cookie settings dialog, which
// is generated from that inventory. Open items are listed in
// ../CLIENT_CONFIRMATION.md (internal, never published). This file holds
// public text only.
//
// cookies.en.ts mirrors this file section by section and block by block.
import type { LegalDocumentContent } from '../types';

export const COOKIES_BG: LegalDocumentContent = {
  title: 'ПОЛИТИКА ЗА БИСКВИТКИТЕ И ЛОКАЛНОТО СЪХРАНЕНИЕ НА KUKO WAY',
  sections: [
    {
      heading: '1. Какво са бисквитките',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'Бисквитките са малки файлове, които сайтът записва в браузъра ви. Локалното съхранение (',
            { text: 'localStorage', code: true },
            ') е подобна технология, която пази информация само на устройството ви. Тази политика описва и двете.',
          ],
        },
      ],
    },
    {
      heading: '2. Кой ги използва',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'Сайтът KUKO WAY се предоставя от 3Д ЛУК ООД, ЕИК 175172901. Как обработваме личните данни е описано в ',
            { text: 'Политиката за поверителност', href: '/privacy' },
            '.',
          ],
        },
      ],
    },
    {
      heading: '3. Какво използваме',
      blocks: [
        {
          type: 'paragraph',
          text: 'Използваме само необходими технологии. Без тях сайтът не може да работи или да изпълни функция, която сте поискали:',
        },
        {
          type: 'list',
          items: [
            'вход, поддържане на сесията и защита на формулярите;',
            'запомняне на езика, темата и избора ви за бисквитки;',
            'запазване на завършените практики на устройството, когато нямате профил;',
            'настройки на менюто за администратори и модератори;',
            'защита от автоматизирани регистрации чрез Google reCAPTCHA, само на страницата за регистрация.',
          ],
        },
        {
          type: 'paragraph',
          text: [
            'Пълният списък с имената и сроковете е в ',
            { text: '„Настройки на бисквитките“', strong: true },
            ' в долната част на сайта. Не използваме бисквитки за анализ или реклама.',
          ],
        },
      ],
    },
    {
      heading: '4. Външни услуги',
      blocks: [
        {
          type: 'list',
          items: [
            [
              { text: 'Google reCAPTCHA', strong: true },
              ' записва бисквитка и запис в локалното съхранение, за да различава хора от автоматизирани програми. За тях се прилага ',
              { text: 'Политиката за поверителност на Google', href: 'https://policies.google.com/privacy' },
              '.',
            ],
            [
              { text: 'YouTube:', strong: true },
              ' страницата „Безплатни видеа“ зарежда миниатюри от YouTube (Google), който получава IP адреса ви. Видеата се отварят в YouTube, където се прилагат правилата на YouTube.',
            ],
          ],
        },
      ],
    },
    {
      heading: '5. Как управлявате избора си',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'Понастоящем не използваме незадължителни технологии. Ако добавим такива, ще поискаме съгласието ви, преди да ги активираме. Можете да промените избора си чрез ',
            { text: '„Настройки на бисквитките“', strong: true },
            '. Можете също да изтриете бисквитките и локалното съхранение от настройките на браузъра. Тогава може да излезете от профила си или да загубите напредъка, запазен без профил.',
          ],
        },
      ],
    },
    {
      heading: '6. Промени',
      blocks: [
        {
          type: 'paragraph',
          text: 'При промяна на използваните технологии ще актуализираме тази политика и при нужда ще поискаме избора ви отново.',
        },
      ],
    },
  ],
};
