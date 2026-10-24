// Privacy Policy, English version of ./privacy.bg.ts (the primary Bulgarian
// text), matching it section by section and block by block.
//
// Connected to the registry (documents.ts) but, like the Bulgarian text, a
// draft: it is not active and only appears in the development-only draft
// preview. Its legal approval status must be confirmed before publication
// (../CLIENT_CONFIRMATION.md).
// The company name and the address stay in Bulgarian as officially given.
// Interface labels match lib/i18n/dictionaries/en.ts.
import type { LegalDocumentContent } from '../types';

export const PRIVACY_EN: LegalDocumentContent = {
  title: 'PRIVACY POLICY OF KUKO WAY',
  sections: [
    {
      heading: '1. Controller',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'The controller of your personal data is ',
            { text: '3Д ЛУК ООД', strong: true },
            ' (3DLOOK LTD), UIC 175172901, address: ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2, telephone 0895720370.',
          ],
        },
      ],
    },
    {
      heading: '2. Data we process',
      blocks: [
        {
          type: 'list',
          items: [
            [
              { text: 'Account:', strong: true },
              ' name, email, password (stored only in hashed form), email verification and account status and, if you choose, an image address, a short bio, interests and profile visibility.',
            ],
            [
              { text: 'Usage:', strong: true },
              ' completed practices and their duration, favourite practices, program and lesson progress, and streaks.',
            ],
            [
              { text: 'Check-ins and notes:', strong: true },
              ' optional check-ins on how you feel before and after a practice, and personal notes, including in programs (section 4).',
            ],
            [
              { text: 'Community:', strong: true },
              ' discussions, replies, reports you submit and moderation decisions.',
            ],
            [
              { text: 'Accepted documents:', strong: true },
              ' the version of the Terms you accepted and of the Privacy Policy you were shown, the language and the time.',
            ],
            [
              { text: 'Technical data:', strong: true },
              ' IP address and browser data, used for abuse protection and sign-in attempts, system logs, cookies and local storage (section 6).',
            ],
            [
              { text: 'Correspondence:', strong: true },
              ' when you write to us.',
            ],
          ],
        },
        {
          type: 'paragraph',
          text: 'We receive this data from you and from your device when you use the Platform. Your name, email and password are required to create an account. Everything else is optional.',
        },
      ],
    },
    {
      heading: '3. Purposes and legal bases',
      blocks: [
        {
          type: 'list',
          items: [
            'Account, sign-in, saving progress, programs and community: performance of a contract (Art. 6(1)(b) GDPR).',
            'Protection against automated sign-ups and abuse (reCAPTCHA, sign-in attempt limits, logs) and moderation: our legitimate interest in keeping the Platform secure (Art. 6(1)(f)).',
            'Handling reports of illegal content and requests to exercise your rights: legal obligation (Art. 6(1)(c)).',
            'Recording accepted documents: our legitimate interest in being able to prove acceptance (Art. 6(1)(f)).',
            'Check-ins and notes: your explicit consent (Art. 6(1)(a) and Art. 9(2)(a)).',
          ],
        },
        {
          type: 'paragraph',
          text: 'We do not use your data for advertising, analytics or marketing, and we do not sell it.',
        },
      ],
    },
    {
      heading: '4. Check-ins and personal notes',
      blocks: [
        {
          type: 'paragraph',
          text: 'Check-ins and notes are optional and visible only to you. Administrators and moderators cannot see them on the Platform. Because they may reveal information about your health, we store them only with your explicit consent. You can withdraw your consent at any time using the contact details in section 1. We then delete your check-ins and notes. Withdrawal does not affect the lawfulness of processing before it. The practices work without check-ins and notes. We do not use this data for recommendations, profiling or advertising.',
        },
      ],
    },
    {
      heading: '5. Visibility in the community',
      blocks: [
        {
          type: 'paragraph',
          text: 'Discussions, replies and your name as their author may be visible to all visitors to the site. Your profile is visible according to the setting you choose: public, logged-in members only, or only you.',
        },
      ],
    },
    {
      heading: '6. Cookies and local storage',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'We use only necessary cookies and local storage: for sign-in, security, language, theme, your cookie choice and saving practices without an account. Details are in our ',
            { text: 'Cookie Policy', href: '/cookies' },
            '.',
          ],
        },
      ],
    },
    {
      heading: '7. Recipients',
      blocks: [
        {
          type: 'paragraph',
          text: 'Data is processed, only as far as necessary, by service providers that help us run the Platform:',
        },
        {
          type: 'list',
          items: [
            [{ text: 'Vercel Inc.:', strong: true }, ' application hosting;'],
            [{ text: 'database and email service providers:', strong: true }, ' data storage and sending email verification and password reset emails;'],
            [
              { text: 'Google:', strong: true },
              ' reCAPTCHA on the registration page receives your IP address and data about your browser and device. Google\'s ',
              { text: 'Privacy Policy', href: 'https://policies.google.com/privacy' },
              ' and ',
              { text: 'Terms of Service', href: 'https://policies.google.com/terms' },
              ' apply to it. Thumbnails on "Free Videos" are loaded from YouTube (Google), which receives your IP address.',
            ],
          ],
        },
        {
          type: 'paragraph',
          text: 'If a user has set an external image address as their profile picture, your browser loads that image from the external server. We disclose data to public authorities only when the law requires it.',
        },
      ],
    },
    {
      heading: '8. Transfers outside the EEA',
      blocks: [
        {
          type: 'paragraph',
          text: 'Google and Vercel may process data in the United States. Such transfers take place only on the basis of a European Commission adequacy decision or of standard contractual clauses approved by the Commission (Articles 45 and 46 GDPR). You can ask for information about the applicable safeguards using the contact details in section 1.',
        },
      ],
    },
    {
      heading: '9. Retention',
      blocks: [
        {
          type: 'list',
          items: [
            'Account and related data, including records of accepted documents: for as long as the account exists. After a deletion request, we delete them without undue delay and no later than one month.',
            'Check-ins and notes: 12 months.',
            'Backups and system logs: for the limited period set by our hosting and database providers, after which they are erased.',
            'Correspondence and reports: as long as necessary to handle them and to defend any legal claims.',
            'Cookies and local storage: as set out in the Cookie Policy.',
          ],
        },
      ],
    },
    {
      heading: '10. Your rights',
      blocks: [
        {
          type: 'paragraph',
          text: 'You have the right to access, rectify and erase your data, to restrict its processing, to data portability, to object to processing based on legitimate interest, and to withdraw your consent. Write to us using the contact details in section 1. We reply within one month. For complex requests this can be extended by two further months, and we will tell you if it is. We may ask you to confirm your identity.',
        },
        {
          type: 'paragraph',
          text: 'You have the right to lodge a complaint with the Bulgarian Commission for Personal Data Protection (cpdp.bg) and to seek a judicial remedy.',
        },
      ],
    },
    {
      heading: '11. Minors',
      blocks: [
        {
          type: 'paragraph',
          text: 'The Platform is intended for persons aged 18 or over. If we learn that we have received the data of a minor, we will delete it.',
        },
      ],
    },
    {
      heading: '12. Security',
      blocks: [
        {
          type: 'paragraph',
          text: 'Passwords are stored only in hashed form. We use HTTPS, secure sessions, sign-in attempt limits and role-based access. If there is a personal data breach, we notify the Commission for Personal Data Protection and the people affected where the GDPR requires it.',
        },
      ],
    },
    {
      heading: '13. Automated decisions',
      blocks: [
        {
          type: 'paragraph',
          text: 'We do not make decisions based solely on automated processing, including profiling, that have legal or similarly significant effects on you.',
        },
      ],
    },
    {
      heading: '14. Changes',
      blocks: [
        {
          type: 'paragraph',
          text: 'We will notify you of material changes in an appropriate way. This page shows the current version and the date it took effect.',
        },
      ],
    },
  ],
};
