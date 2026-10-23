// Privacy Policy: English translation of `02_Politika_poveritelnost.docx`
// (folder `terms and conditions, privacy policy и cookie policy/`), from the
// Bulgarian text in ./privacy.bg.ts.
//
// UNREVIEWED TRANSLATION (23.10.2026). It follows the Bulgarian source
// block by block: same sections, lists, line breaks, bold runs, monospace
// names and links. It is NOT connected to the registry (documents.ts keeps
// `en: null`), so it can never be published; it is shown only in the
// development-only draft preview (legal.service.ts). It needs review by the owner and a
// lawyer before it is used.
//
// Kept exactly as in the source: dates and article references. Unresolved
// placeholders keep their brackets; only their descriptive labels are
// translated (the mapping is checked in tests/legal-translations.test.ts).
// Labels the source quotes from the interface use the English interface
// labels (lib/i18n/dictionaries/en.ts). Translation questions for review:
// ../TRANSLATION_REVIEW.md.
//
// `// EDITORIAL [A|B|C]` comments mark the same internal editorial passages
// as in the Bulgarian file ([A] marked by the document as not for
// publication, [B] addressed to the team, [C] tied to the review date).
import type { LegalDocumentContent } from '../types';

export const PRIVACY_EN: LegalDocumentContent = {
  title: 'PRIVACY POLICY OF KUKO WAY',
  // EDITORIAL [B] instruction or verification task addressed to the team: the version/date/site/status line ("Status: draft – the actual processing operations and providers must be verified").
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
    ' draft – the actual processing operations and providers must be verified',
  ],
  intro: [
    {
      type: 'blockquote',
      text: [
        // EDITORIAL [A] marked by the document itself as not for publication: the whole quoted note ("Note for the team, not for publication: ...").
        { text: 'Note for the team, not for publication:', strong: true },
        ' The [●] fields and the processes marked for confirmation must be checked against the system and the contracts with the providers. The text alone does not prove technical compliance with the GDPR.',
      ],
    },
  ],
  sections: [
    {
      heading: '1. Who is responsible for personal data',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'The controller of personal data in connection with the KUKO WAY platform is ',
            { text: '[EXACT LEGAL ENTITY]', strong: true },
            ', UIC/BULSTAT ',
            { text: '[●]', strong: true },
            ', address ',
            { text: '[●]', strong: true },
            ', email for personal data questions ',
            { text: '[●]', strong: true },
            ', phone ',
            { text: '[●]', strong: true },
            '. If a data protection officer has been appointed, their details are ',
            { text: '[●/not applicable]', strong: true },
            '. This controller is not automatically identified with the “KUKO WAY” trade mark.',
          ],
        },
      ],
    },
    {
      heading: '2. What data we may process',
      blocks: [
        { type: 'paragraph', text: 'Depending on how you use the Platform, the following data is processed:' },
        {
          type: 'list',
          items: [
            [
              { text: 'Account and access data:', strong: true },
              ' name or pseudonym, email, account identifier, settings, sign-in and session verification data; where an external sign-in method is used – data received from its provider in accordance with the selected settings.',
            ],
            [
              { text: 'Practice usage data:', strong: true },
              ' selected, started and completed practices, programs, history, streaks, preferences and progress. Without an account, certain data is kept only in the device’s browser.',
            ],
            [
              { text: 'Personal notes and responses:', strong: true },
              ' texts you voluntarily enter in your journal, feedback on how you feel and, if activated, personalisation questionnaires.',
            ],
            [
              { text: 'Communication data:', strong: true },
              ' enquiries, complaints, support requests, event messages and correspondence.',
            ],
            [
              { text: 'Community posts:', strong: true },
              ' pseudonym, content of discussions, comments, reactions and information about reports or moderation, if these features are used.',
            ],
            [
              { text: 'Payment and contract data:', strong: true },
              ' orders, selected product, amount, payment status and accounting data ',
              // EDITORIAL [C] statement tied to the review date or draft; may read as public text, needs a decision: section 2, payment data: "At the time of the public review, Stripe is described on the website as being in test mode; ...".
              { text: 'only once real payments are activated', strong: true },
              '. At the time of the public review, Stripe is described on the website as being in test mode; this is not confirmation of real card payments.',
            ],
            [
              { text: 'Technical data:', strong: true },
              ' IP address, date and time of the request, device, browser, system events, necessary cookies, security logs and cookie preference choices.',
            ],
            [
              { text: 'Newsletter data:', strong: true },
              ' email and proof of consent, ',
              { text: 'once the subscription is activated', strong: true },
              // EDITORIAL [C] statement tied to the review date or draft; may read as public text, needs a decision: section 2, newsletter data: "At the time the website was checked, sign-up was marked as inactive."
              '. At the time the website was checked, sign-up was marked as inactive.',
            ],
          ],
        },
        {
          type: 'paragraph',
          text: 'We do not ask for a personal identification number (EGN) or a photo of an identity card for a standard account; if a specific legal reason requires otherwise, we will provide separate information.',
        },
      ],
    },
    {
      heading: '3. Special categories of data – health information',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'KUKO WAY offers practices related to movement, recovery, breathing and body awareness. Merely visiting a practice page does not necessarily mean that you are providing health data. ',
            {
              text: 'However, personal notes, symptoms, pain, limitations, diagnoses, mental health and certain individual profiles may reveal a state of health and be a special category of data under Art. 9 GDPR.',
              strong: true,
            },
          ],
        },
        {
          type: 'paragraph',
          text: [
            'Before we activate collection or personalisation based on such data, we must establish a valid basis under Art. 6 GDPR and a separate exception under Art. 9, obtaining, where appropriate, ',
            { text: 'explicit, specific and separate consent', strong: true },
            ', which can be withdrawn. A simple “I accept the Terms and Conditions” tick box is not sufficient. Health data fields should not be mandatory if they are not necessary for a requested feature; personal notes provided are not used for advertising.',
          ],
        },
        {
          type: 'paragraph',
          text: [
            // EDITORIAL [B] instruction or verification task addressed to the team: section 3, the whole paragraph "Technical prerequisite for publication: ...".
            { text: 'Technical prerequisite for publication:', strong: true },
            ' the team must confirm whether personal notes are stored on a server, who in the team has access, whether there are automated recommendations and whether health data is actually processed. If lawful and secure processing is not ensured, the feature must not collect sensitive data.',
          ],
        },
      ],
    },
    {
      heading: '4. For what purposes and on what basis',
      blocks: [
        {
          type: 'list',
          items: [
            [
              { text: 'Account, sign-in, history, synchronisation:', strong: true },
              ' Art. 6(1)(b) GDPR – performance of a contract, only for the necessary data.',
            ],
            [
              { text: 'Paid programs and customer service:', strong: true },
              ' Art. 6(1)(b) GDPR – once sales are actually activated.',
            ],
            [
              { text: 'Accounting and tax obligations:', strong: true },
              ' Art. 6(1)(c) GDPR – compliance with a legal obligation.',
            ],
            [
              { text: 'Protection against abuse and security:', strong: true },
              ' Art. 6(1)(f) GDPR – legitimate interest, after an appropriate balancing test.',
            ],
            [
              { text: 'Newsletter:', strong: true },
              ' Art. 6(1)(a) GDPR – separate, voluntary consent and easy unsubscribing.',
            ],
            [
              { text: 'Optional analytics and advertising:', strong: true },
              // EDITORIAL [C] statement tied to the review date or draft; may read as public text, needs a decision: section 4, analytics: "at the time of the public review, no such technologies have been announced as active".
              ' consent where required by law; at the time of the public review, no such technologies have been announced as active.',
            ],
            [
              { text: 'Health data in notes and questionnaires:', strong: true },
              ' Art. 6 GDPR and a separate valid basis under Art. 9, for example Art. 9(2)(a) for explicit consent, if applicable.',
            ],
            [
              { text: 'Moderation and reports:', strong: true },
              ' Art. 6(1)(b), (c) or (f) depending on the specific purpose, with an assessment under the Digital Services Act.',
            ],
          ],
        },
        {
          type: 'paragraph',
          text: 'We do not use consent as a formal basis for processing that is actually necessary for the performance of a contract or for compliance with a legal obligation.',
        },
      ],
    },
    {
      heading: '5. Public community and visibility',
      blocks: [
        {
          type: 'paragraph',
          text: 'Content published in the discussion sections may be visible to other users or to visitors, depending on the section’s settings. The fact that a post is accessible does not mean that anyone has the right to copy it or distribute it outside the Platform. Do not share health diagnoses, photos of medical documents, other people’s personal data or other confidential information publicly.',
        },
      ],
    },
    {
      heading: '6. Cookies and local storage',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'The Platform uses technologies for sign-in and security, the selected language, the theme, the history of completed practices in the relevant browser and remembering the cookie choice. The visible panel lists NextAuth/session cookies, ',
            { text: 'ptd_locale', code: true },
            ', ',
            { text: 'kw_cookie_consent', code: true },
            ', Google reCAPTCHA, ',
            { text: 'theme', code: true },
            ', ',
            { text: 'ptd:completed:*', code: true },
            ', ',
            { text: 'ptd:imported:*', code: true },
            ' and other local keys. The full list and the retention periods are in the ',
            { text: 'Cookie Policy', href: 'https://daily-trainer-app.vercel.app/cookies' },
            '.',
          ],
        },
        {
          type: 'paragraph',
          text: [
            'Necessary technologies are not automatically used for marketing. If measurement, advertising, an embedded external video player or a new tool is added, the policy and the choice panel must be updated ',
            { text: 'before', strong: true },
            ' the relevant processing.',
          ],
        },
      ],
    },
    {
      heading: '7. Recipients and providers',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'Data may be provided, only to the extent necessary, to providers of hosting and technical infrastructure, authentication and security services, support, email and — where payments are active — payment operators. The public address ',
            { text: 'vercel.app', code: true },
            ' points to Vercel infrastructure; the website also visibly uses Google reCAPTCHA, as well as a test integration with Stripe. ',
            // EDITORIAL [B] instruction or verification task addressed to the team: section 7: "The exact legal entities, ... are verified before publication ...".
            {
              text: 'The exact legal entities, roles (controller or processor), countries of storage, terms and contracts are verified before publication',
              strong: true,
            },
            ' and, where necessary, described in a separate register.',
          ],
        },
        {
          type: 'paragraph',
          text: 'We do not sell users’ personal data. Data is provided to public authorities only where there is an applicable legal basis.',
        },
      ],
    },
    {
      heading: '8. Transfers outside the European Economic Area',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'When international technical providers are used, certain data may be processed outside the EEA. This is permitted only with an appropriate legal basis and mechanism under Chapter V GDPR — for example, an adequacy decision for the specific recipient, where applicable, or standard contractual clauses and the necessary supplementary measures. ',
            // EDITORIAL [C] statement tied to the review date or draft; may read as public text, needs a decision: section 8: "We do not claim that every provider mentioned is certified ... without it having been verified."
            {
              text: 'We do not claim that every provider mentioned is certified under the EU–US Data Privacy Framework without this having been verified.',
              strong: true,
            },
            ' Details of the specific transfers: ',
            { text: '[to be completed after a technical audit]', strong: true },
            '.',
          ],
        },
      ],
    },
    {
      heading: '9. How long we keep data',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'We apply storage limitation. The following periods are ',
            // EDITORIAL [B] instruction or verification task addressed to the team: section 9: "... a policy for approval, not a statement about automated processes already set up".
            { text: 'a policy for approval, not a statement about automated processes already set up', strong: true },
            ':',
          ],
        },
        {
          type: 'list',
          items: [
            [
              'Account, personal notes and history: while the account is active; after deletion, they are erased or anonymised within ',
              { text: '[approved period, e.g. up to 30 days]', strong: true },
              ', unless there is a valid legal basis for keeping them longer.',
            ],
            [
              'Archive backups: up to ',
              { text: '[specific technical period]', strong: true },
              ', with protected access and periodic overwriting.',
            ],
            [
              'Correspondence and requests: ',
              { text: '[period justified by the purpose and the protection of legal claims]', strong: true },
              '.',
            ],
            'Accounting documents and contract data: for the periods provided for in the applicable Bulgarian accounting and tax legislation.',
            ['Security logs: ', { text: '[period justified by a risk assessment]', strong: true }, '.'],
            'Newsletter: until consent is withdrawn or the service ends, with a minimal record to prove the choice where necessary.',
            'Cookies and local storage: according to the specific periods in the Cookie Policy.',
          ],
        },
      ],
    },
    {
      heading: '10. User rights',
      blocks: [
        {
          type: 'paragraph',
          text: 'Under the GDPR, subject to the applicable conditions, you have the right of access to your data, rectification, erasure, restriction, portability and objection to processing based on legitimate interest, as well as the right to withdraw consent without retroactive effect. You have the right not to be subject to a decision based solely on automated processing where the conditions of Art. 22 GDPR are met.',
        },
        {
          type: 'paragraph',
          text: [
            'To exercise your rights: ',
            { text: '[GDPR email]', strong: true },
            '. We respond within one month; this period may be extended, with notice, in the cases permitted by law. We may ask for reasonable verification of identity without collecting unnecessary documents.',
          ],
        },
        {
          type: 'paragraph',
          text: [
            'You have the right to lodge a complaint with the ',
            { text: 'Commission for Personal Data Protection', strong: true },
            ' (https://cpdp.bg/), as well as the right to judicial protection.',
          ],
        },
      ],
    },
    {
      heading: '11. Children and minors',
      blocks: [
        {
          type: 'paragraph',
          text: [
            // EDITORIAL [B] instruction or verification task addressed to the team: the bold label at the start of section 11; the rest is policy text.
            { text: 'Proposed product policy:', strong: true },
            ' personalised accounts and programs are intended for adults until the team introduces a separate mode for minors. In Bulgaria, where data of a child under 14 is processed on the basis of consent, the consent of a parent/guardian is required under Art. 25c of the Personal Data Protection Act (ZZLD). The safety of the practices and the rules on contracts and children’s rights are considered separately. If we become aware that we have received data in breach of these rules, we will take appropriate action.',
          ],
        },
      ],
    },
    {
      heading: '12. Security and incidents',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'We use and maintain proportionate technical and organisational measures, such as access management, session protection, HTTPS, restriction of permissions and control of external providers, ',
            { text: 'to the extent they are actually implemented and confirmed', strong: true },
            '. In the event of a security breach, we assess the risk and notify the competent supervisory authority and the affected persons where the GDPR requires this.',
          ],
        },
      ],
    },
    {
      heading: '13. Automation and individual recommendations',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'If the Platform uses an algorithm to recommend exercises based on history or self-assessment, we will explain the input data, the purposes and the available human oversight. ',
            // EDITORIAL [B] instruction or verification task addressed to the team: section 13: "[Confirm whether there actually is profiling or automated decision-making with a significant effect.]"
            { text: '[Confirm whether there actually is profiling or automated decision-making with a significant effect.]', strong: true },
            ' If such processing is introduced, we will update this policy before it is used.',
          ],
        },
      ],
    },
    {
      heading: '14. Changes and contact',
      blocks: [
        {
          type: 'paragraph',
          text: 'In the event of material changes, we notify users in an appropriate way and publish a new effective date. Changes that require new consent are introduced only after it has been validly obtained.',
        },
        {
          type: 'paragraph',
          text: [
            { text: 'Controller:', strong: true },
            ' [●]',
            { lineBreak: true },
            { text: 'Address:', strong: true },
            ' [●]',
            { lineBreak: true },
            { text: 'Email for personal data:', strong: true },
            ' [●]',
            { lineBreak: true },
            { text: 'Phone:', strong: true },
            ' [●]',
            { lineBreak: true },
            { text: 'Effective date:', strong: true },
            ' [●]',
          ],
        },
      ],
    },
  ],
  // EDITORIAL [B] instruction or verification task addressed to the team: the note after the closing rule ("Key check before publication: ...").
  closing: [
    {
      type: 'paragraph',
      text: [
        { text: 'Key check before publication:', strong: true },
        ' health data and notes, contracts with providers, transfers, deletion periods, information about external sign-in, community reports, consent settings that actually work.',
      ],
    },
  ],
};
