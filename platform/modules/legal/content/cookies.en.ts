// Cookie Policy, English version of ./cookies.bg.ts (the primary Bulgarian
// text), matching it section by section and block by block.
//
// Connected to the registry (documents.ts) but, like the Bulgarian text, a
// draft: it is not active and only appears in the development-only draft
// preview. Its legal approval status must be confirmed before publication
// (../CLIENT_CONFIRMATION.md).
// The company name stays in Bulgarian as officially given. Interface labels
// match lib/i18n/dictionaries/en.ts.
import type { LegalDocumentContent } from '../types';

export const COOKIES_EN: LegalDocumentContent = {
  title: 'COOKIE AND LOCAL STORAGE POLICY OF KUKO WAY',
  sections: [
    {
      heading: '1. What cookies are',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'Cookies are small files that a website stores in your browser. Local storage (',
            { text: 'localStorage', code: true },
            ') is a similar technology that keeps information on your device only. This policy covers both.',
          ],
        },
      ],
    },
    {
      heading: '2. Who uses them',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'The KUKO WAY site is provided by 3Д ЛУК ООД (3DLOOK LTD), UIC 175172901. How we process personal data is described in our ',
            { text: 'Privacy Policy', href: '/privacy' },
            '.',
          ],
        },
      ],
    },
    {
      heading: '3. What we use',
      blocks: [
        {
          type: 'paragraph',
          text: 'We use only necessary technologies. Without them the site cannot work or provide a feature you have asked for:',
        },
        {
          type: 'list',
          items: [
            'signing in, keeping your session and protecting forms;',
            'remembering your language, theme and cookie choice;',
            'saving completed practices on your device when you have no account;',
            'menu settings for administrators and moderators;',
            'protection against automated sign-ups with Google reCAPTCHA, on the registration page only.',
          ],
        },
        {
          type: 'paragraph',
          text: [
            'The full list, with names and durations, is in ',
            { text: '"Cookie settings"', strong: true },
            ' at the bottom of the site. We do not use cookies for analytics or advertising.',
          ],
        },
      ],
    },
    {
      heading: '4. Third-party services',
      blocks: [
        {
          type: 'list',
          items: [
            [
              { text: 'Google reCAPTCHA', strong: true },
              ' sets a cookie and a local-storage entry to tell people apart from automated programs. ',
              { text: "Google's Privacy Policy", href: 'https://policies.google.com/privacy' },
              ' applies to them.',
            ],
            [
              { text: 'YouTube:', strong: true },
              ' the "Free Videos" page loads thumbnails from YouTube (Google), which receives your IP address. The videos open on YouTube, where YouTube\'s own terms apply.',
            ],
          ],
        },
      ],
    },
    {
      heading: '5. Managing your choice',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'We do not currently use any optional technologies. If we add any, we will ask for your consent before turning them on. You can change your choice in ',
            { text: '"Cookie settings"', strong: true },
            '. You can also delete cookies and local storage in your browser settings. If you do, you may be signed out or lose progress saved without an account.',
          ],
        },
      ],
    },
    {
      heading: '6. Changes',
      blocks: [
        {
          type: 'paragraph',
          text: 'If the technologies we use change, we will update this policy and, where needed, ask for your choice again.',
        },
      ],
    },
  ],
};
