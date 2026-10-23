// Cookie Policy (Политика за бисквитките): Bulgarian text of `03_Politika_biskvitki.docx`
// (folder `terms and conditions, privacy policy и cookie policy/`).
//
// VERBATIM SOURCE TEXT, with one owner-requested change (23.10.2026): DOCX
// sections 4 („Подробен списък“) and 5 („Необходими и незадължителни
// технологии“) were removed in full, and sections 6–8 renumbered 4–6.
// Everything else was converted mechanically from the .docx, keeping every
// heading, paragraph, list, line break, bold run, monospace name and
// hyperlink, in the source order. Do not edit, shorten or "fix" it here.
//
// The source is a draft (version "проект 1.0"). It still contains its
// bracketed fields to be filled in and its notes for the team, exactly as
// supplied, so it must not be published (see documents.ts).
//
// `// EDITORIAL [A|B|C]` comments mark passages that look like internal
// editorial material rather than public legal text ([A] marked by the
// document as not for publication, [B] addressed to the team, [C] tied to
// the review date). They are comments only and change nothing; the text
// stays as supplied until the owner/lawyer decide.
import type { LegalDocumentContent } from '../types';

export const COOKIES_BG: LegalDocumentContent = {
  title: 'ПОЛИТИКА ЗА БИСКВИТКИТЕ И ЛОКАЛНОТО СЪХРАНЕНИЕ НА KUKO WAY',
  // EDITORIAL [B] instruction or verification task addressed to the team: the version/date/site/status line ("Статус: изготвено по публично видимия панел ...; необходима е техническа проверка").
  info: [
    { text: 'Версия:', strong: true },
    ' проект 1.0 · ',
    { text: 'Дата:', strong: true },
    ' 23 октомври 2026 г.',
    { lineBreak: true },
    { text: 'Сайт:', strong: true },
    ' https://daily-trainer-app.vercel.app/',
    { lineBreak: true },
    { text: 'Статус:', strong: true },
    ' изготвено по публично видимия панел за бисквитки; необходима е техническа проверка',
  ],
  intro: [
    {
      type: 'blockquote',
      text: [
        // EDITORIAL [A] marked by the document itself as not for publication: the whole quoted note ("За екипа, не за публикуване: ...").
        { text: 'За екипа, не за публикуване:', strong: true },
        ' Инвентарът по-долу е извлечен от видимия панел на сайта към 23.10.2026 г. Това не е независим технически скан на всички заявки, домейни и срокове. Доказателството за съответствие изисква проверка в браузър/мрежови инструменти и документация на доставчиците.',
      ],
    },
  ],
  sections: [
    {
      heading: '1. Какво представляват бисквитките',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'Бисквитките са малки файлове или идентификатори, които браузърът съхранява при посещение на уебсайт. Подобни технологии включват ',
            { text: 'localStorage', code: true },
            ', ',
            { text: 'sessionStorage', code: true },
            ' и други средства за съхраняване или достъп до информация на устройството. Не всички описани по-долу записи са HTTP бисквитки, но също могат да попаднат под правилата за поверителност и достъп до крайното устройство.',
          ],
        },
      ],
    },
    {
      heading: '2. Кой използва тези технологии',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'Сайтът KUKO WAY се предоставя от ',
            { text: '[ТОЧНО ЮРИДИЧЕСКО ЛИЦЕ]', strong: true },
            ', ЕИК ',
            { text: '[●]', strong: true },
            ', контакт ',
            { text: '[имейл]', strong: true },
            '. За въпроси относно данните и правата ви вижте ',
            { text: 'Политиката за поверителност', href: 'https://daily-trainer-app.vercel.app/privacy' },
            '.',
          ],
        },
      ],
    },
    {
      heading: '3. За какво ги използваме',
      blocks: [
        {
          type: 'paragraph',
          text: [
            // EDITORIAL [C] statement tied to the review date or draft; may read as public text, needs a decision: section 3: "Към датата на публичния преглед панелът на сайта показва ...".
            'Към датата на публичния преглед панелът на сайта показва ',
            { text: '11 групи необходими записи', strong: true },
            ' за следните функции:',
          ],
        },
        {
          type: 'list',
          items: [
            'сигурен вход, поддържане на сесия и защита на заявките;',
            'запомняне на езика и избраната тема;',
            'запомняне на избора за бисквитки;',
            'запазване на завършени практики на устройството без профил;',
            'локални предпочитания на администратори/модератори;',
            'защита от автоматизирани регистрации чрез Google reCAPTCHA.',
          ],
        },
        {
          type: 'paragraph',
          text: [
            'Публичният панел изрично посочва, че в момента ',
            { text: 'няма активни технологии в категориите „Предпочитания“, „Анализ“ и „Маркетинг“', strong: true },
            // EDITORIAL [B] instruction or verification task addressed to the team: section 3: "Това следва да остане вярно и технически; ако добавите инструменти, ...".
            '. Това следва да остане вярно и технически; ако добавите инструменти, списъкът и панелът се актуализират предварително.',
          ],
        },
      ],
    },
    {
      heading: '4. Как управлявате избора си',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'При първото посещение се показва панел с възможности ',
            { text: '„Персонализирай“', strong: true },
            ', ',
            { text: '„Отказвам незадължителните“', strong: true },
            ' и ',
            { text: '„Приемам всички“', strong: true },
            '. По всяко време можете отново да отворите ',
            { text: '„Настройки на бисквитките“', strong: true },
            ' в долната част на сайта, да промените избора си и да го запазите. Възможно е да изтривате бисквитки и локалното съхранение и през настройките на браузъра; това може да доведе до изход от профила или загуба на локална история, която не е синхронизирана.',
          ],
        },
        {
          type: 'paragraph',
          text: 'Ако в момента няма активни незадължителни инструменти, бутоните за съгласие не означават, че потребителят разрешава неопределени бъдещи инструменти. При добавяне на нова цел ще предоставим ясна информация и ще поискаме съответния нов избор.',
        },
      ],
    },
    {
      heading: '5. Бисквитки от трети лица и вградено съдържание',
      blocks: [
        {
          type: 'paragraph',
          text: 'На сайта е видимо Google reCAPTCHA за защита на регистрацията. При бъдещо вграждане на YouTube, платежни прозорци, социални мрежи, чат или други външни услуги може да възникнат допълнителни бисквитки или заявки; те следва да се инвентаризират и да се блокират до съгласие, когато то е необходимо. Понастоящем не твърдим, че такива външни услуги са активни на всички страници.',
        },
      ],
    },
    {
      heading: '6. Актуализации и контакт',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'Преглеждаме политиката при промяна на технология, доставчик, цел или срок на съхранение. Актуалната версия остава публикувана на този адрес. За въпроси: ',
            { text: '[имейл]', strong: true },
            '.',
          ],
        },
        {
          type: 'paragraph',
          text: [
            { text: 'Дата на влизане в сила:', strong: true },
            ' [действителна дата на публикуване]',
            { lineBreak: true },
            { text: 'Администратор:', strong: true },
            ' [●]',
            { lineBreak: true },
            { text: 'Контакт:', strong: true },
            ' [●]',
          ],
        },
      ],
    },
  ],
  // EDITORIAL [B] instruction or verification task addressed to the team: the note after the closing rule ("Контрол преди публикуване: ...").
  closing: [
    {
      type: 'paragraph',
      text: [
        { text: 'Контрол преди публикуване:', strong: true },
        ' извършете проверка в чист браузър преди и след отказ/приемане, на всички основни страници (вход, регистрация, общност, плащане); документирайте заявките към Google и Stripe и обновете списъка при всяка интеграция.',
      ],
    },
  ],
};
