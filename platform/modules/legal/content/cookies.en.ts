// Cookie Policy: English translation of `03_Politika_biskvitki.docx`
// (folder `terms and conditions, privacy policy и cookie policy/`), from the
// Bulgarian text in ./cookies.bg.ts.
//
// UNREVIEWED TRANSLATION (23.10.2026). It follows the Bulgarian source
// block by block: same sections, lists, line breaks, bold runs, monospace
// names and links. It is NOT connected to the registry (documents.ts keeps
// `en: null`), so it can never be published; it is shown only in the
// development-only draft preview (legal.service.ts). Synced with the
// Bulgarian text (23.10.2026): former sections 4 ("Detailed list") and 5
// ("Necessary and optional technologies") removed, 6–8 renumbered 4–6.
// It needs review by the owner and a
// lawyer before it is used.
//
// Kept exactly as in the source: cookie and storage names, durations and
// dates. Unresolved placeholders keep their brackets; only their descriptive
// labels are translated (the mapping is checked in
// tests/legal-translations.test.ts). Labels the source quotes from the
// interface use the English interface labels (lib/i18n/dictionaries/en.ts).
// Translation questions for review: ../TRANSLATION_REVIEW.md.
//
// `// EDITORIAL [A|B|C]` comments mark the same internal editorial passages
// as in the Bulgarian file ([A] marked by the document as not for
// publication, [B] addressed to the team, [C] tied to the review date).
import type { LegalDocumentContent } from '../types';

export const COOKIES_EN: LegalDocumentContent = {
  title: 'COOKIE AND LOCAL STORAGE POLICY OF KUKO WAY',
  // EDITORIAL [B] instruction or verification task addressed to the team: the version/date/site/status line ("Status: prepared from the publicly visible cookie panel; technical verification required").
  info: [
    { text: 'Version:', strong: true },
    ' draft 1.0 · ',
    { text: 'Date:', strong: true },
    ' 23 October 2026',
    { lineBreak: true },
    { text: 'Website:', strong: true },
    ' https://daily-trainer-app.vercel.app/',
    { lineBreak: true },
    { text: 'Status:', strong: true },
    ' prepared from the publicly visible cookie panel; technical verification required',
  ],
  intro: [
    {
      type: 'blockquote',
      text: [
        // EDITORIAL [A] marked by the document itself as not for publication: the whole quoted note ("For the team, not for publication: ...").
        { text: 'For the team, not for publication:', strong: true },
        ' The inventory below was taken from the visible panel on the website as at 23.10.2026. It is not an independent technical scan of all requests, domains and periods. Proof of compliance requires a check using the browser/network tools and the providers’ documentation.',
      ],
    },
  ],
  sections: [
    {
      heading: '1. What cookies are',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'Cookies are small files or identifiers that the browser stores when you visit a website. Similar technologies include ',
            { text: 'localStorage', code: true },
            ', ',
            { text: 'sessionStorage', code: true },
            ' and other means of storing information on, or accessing information from, the device. Not all of the records described below are HTTP cookies, but they may also fall under the rules on privacy and access to terminal equipment.',
          ],
        },
      ],
    },
    {
      heading: '2. Who uses these technologies',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'The KUKO WAY website is provided by ',
            { text: '[EXACT LEGAL ENTITY]', strong: true },
            ', UIC ',
            { text: '[●]', strong: true },
            ', contact ',
            { text: '[email]', strong: true },
            '. For questions about your data and your rights, see the ',
            { text: 'Privacy Policy', href: 'https://daily-trainer-app.vercel.app/privacy' },
            '.',
          ],
        },
      ],
    },
    {
      heading: '3. What we use them for',
      blocks: [
        {
          type: 'paragraph',
          text: [
            // EDITORIAL [C] statement tied to the review date or draft; may read as public text, needs a decision: section 3: "At the date of the public review, the panel on the website shows ...".
            'At the date of the public review, the panel on the website shows ',
            { text: '11 groups of necessary records', strong: true },
            ' for the following functions:',
          ],
        },
        {
          type: 'list',
          items: [
            'secure sign-in, session maintenance and request protection;',
            'remembering the language and the selected theme;',
            'remembering the cookie choice;',
            'saving completed practices on the device without an account;',
            'local preferences of administrators/moderators;',
            'protection against automated registrations through Google reCAPTCHA.',
          ],
        },
        {
          type: 'paragraph',
          text: [
            'The public panel expressly states that there are currently ',
            { text: 'no active technologies in the “Preferences”, “Analytics” and “Marketing” categories', strong: true },
            // EDITORIAL [B] instruction or verification task addressed to the team: section 3: "This should remain true technically as well; if you add tools, ...".
            '. This should remain true technically as well; if you add tools, the list and the panel are updated in advance.',
          ],
        },
      ],
    },
    {
      heading: '4. How you manage your choice',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'On your first visit, a panel is shown with the options ',
            { text: '“Customize”', strong: true },
            ', ',
            { text: '“Reject optional”', strong: true },
            ' and ',
            { text: '“Accept all”', strong: true },
            '. At any time, you can reopen ',
            { text: '“Cookie settings”', strong: true },
            ' at the bottom of the website, change your choice and save it. You can also delete cookies and local storage through your browser settings; this may sign you out of your account or cause the loss of local history that has not been synchronised.',
          ],
        },
        {
          type: 'paragraph',
          text: 'If there are currently no active optional tools, the consent buttons do not mean that the user authorises unspecified future tools. When a new purpose is added, we will provide clear information and ask for the corresponding new choice.',
        },
      ],
    },
    {
      heading: '5. Third-party cookies and embedded content',
      blocks: [
        {
          type: 'paragraph',
          text: 'Google reCAPTCHA is visibly used on the website to protect registration. If YouTube, payment windows, social networks, chat or other external services are embedded in the future, additional cookies or requests may arise; they should be inventoried and blocked until consent is given, where consent is required. We do not currently claim that such external services are active on all pages.',
        },
      ],
    },
    {
      heading: '6. Updates and contact',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'We review the policy whenever a technology, provider, purpose or retention period changes. The current version remains published at this address. For questions: ',
            { text: '[email]', strong: true },
            '.',
          ],
        },
        {
          type: 'paragraph',
          text: [
            { text: 'Effective date:', strong: true },
            ' [actual publication date]',
            { lineBreak: true },
            { text: 'Controller:', strong: true },
            ' [●]',
            { lineBreak: true },
            { text: 'Contact:', strong: true },
            ' [●]',
          ],
        },
      ],
    },
  ],
  // EDITORIAL [B] instruction or verification task addressed to the team: the note after the closing rule ("Pre-publication check: ...").
  closing: [
    {
      type: 'paragraph',
      text: [
        { text: 'Pre-publication check:', strong: true },
        ' check in a clean browser before and after refusing/accepting, on all main pages (sign-in, registration, community, payment); document the requests to Google and Stripe and update the list with every integration.',
      ],
    },
  ],
};
