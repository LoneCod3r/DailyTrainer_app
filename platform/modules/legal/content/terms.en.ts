// Terms & Conditions: English translation of `01_Obshti_usloviya.docx`
// (folder `terms and conditions, privacy policy и cookie policy/`), from the
// synced Bulgarian text in ./terms.bg.ts.
//
// UNREVIEWED TRANSLATION (23.10.2026). It follows the Bulgarian source
// block by block: same sections, clause numbers, lists, line breaks, bold
// runs, monospace names and links. It is NOT connected to the registry
// (documents.ts keeps `en: null`), so it can never be published; it is shown
// only in the development-only draft preview (legal.service.ts). It needs review
// by the owner and a lawyer before it is used.
//
// Kept exactly as in the source: company names (3Д ЛУК ООД in 1.2,
// 3DLOOK LTD in 14), identifiers, addresses, phone and VAT numbers, prices
// and dates. The client-confirmed details appear without square brackets,
// exactly as in ./terms.bg.ts. Unresolved placeholders keep their brackets;
// only their descriptive labels are translated (the mapping is checked in
// tests/legal-translations.test.ts). Labels the source quotes from the
// interface use the English interface labels (lib/i18n/dictionaries/en.ts).
// Translation questions for review: ../TRANSLATION_REVIEW.md.
//
// `// EDITORIAL [A|B|C]` comments mark the same internal editorial passages
// as in the Bulgarian file ([A] marked by the document as not for
// publication, [B] addressed to the team, [C] tied to the review date).
import type { LegalDocumentContent } from '../types';

export const TERMS_EN: LegalDocumentContent = {
  title: 'TERMS AND CONDITIONS OF USE OF KUKO WAY',
  // EDITORIAL [B] instruction or verification task addressed to the team: the version/date/site/status line ("Status: draft for legal and technical review before publication").
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
    ' draft for legal and technical review before publication',
  ],
  intro: [
    {
      type: 'blockquote',
      text: [
        // EDITORIAL [A] marked by the document itself as not for publication: the whole quoted note ("For the team, not for publication: ...").
        { text: 'For the team, not for publication:', strong: true },
        ' The fields in square brackets must be completed. The descriptions of future purchases, donations and subscriptions must be checked against the features that are actually activated. These Terms and Conditions do not override mandatory rights under consumer protection law.',
      ],
    },
  ],
  sections: [
    {
      heading: '1. Who provides KUKO WAY',
      blocks: [
        {
          type: 'paragraph',
          text: '1.1. KUKO WAY (“the Platform”) is a website and digital environment for practices, educational materials, movement, breathing, body awareness, programs and community, available at the address stated above and at its future official domain.',
        },
        {
          type: 'paragraph',
          text: [
            '1.2. The provider and the party to contracts with users is ',
            { text: '3Д ЛУК ООД', strong: true },
            ', UIC/BULSTAT ',
            { text: '175172901', strong: true },
            ', registered office and management address ',
            { text: 'ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2', strong: true },
            ', correspondence address ',
            { text: 'ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2', strong: true },
            ', email ',
            { text: '[●]', strong: true },
            ', phone ',
            { text: '0895720370', strong: true },
            ', VAT number ',
            { text: 'BG175172901', strong: true },
            ' (“the Provider”). If payments for particular products, events or support are received by different legal entities, the relevant entity is expressly stated before the transaction.',
          ],
        },
        {
          type: 'paragraph',
          text: '1.3. The Provider’s details, these Terms and Conditions and the applicable policies are provided in clear, understandable Bulgarian and remain permanently accessible on the website.',
        },
      ],
    },
    {
      heading: '2. Scope and acceptance',
      blocks: [
        {
          type: 'paragraph',
          text: '2.1. These Terms and Conditions govern visits to and use of the website, registration and the account, personal notes and practice tracking, community features, free content and future paid digital products.',
        },
        {
          type: 'paragraph',
          text: '2.2. Browsing the public pages does not require creating an account. Where a particular feature requires an account or paid access, this is indicated in advance.',
        },
        {
          type: 'paragraph',
          text: [
            '2.3. On registration, the user is given access to the current version of these Terms and Conditions and confirms acceptance of them through a separate field that is not pre-ticked. Acceptance of the Terms and Conditions ',
            { text: 'does not', strong: true },
            ' in itself constitute consent to marketing, optional cookies or the processing of health data.',
          ],
        },
        {
          type: 'paragraph',
          text: '2.4. If a particular program, course, event or membership has special terms, they are communicated before the order. In the event of conflict, mandatory law prevails.',
        },
      ],
    },
    {
      heading: '3. What the Platform includes',
      blocks: [
        // EDITORIAL [C] statement tied to the review date or draft; may read as public text, needs a decision: clause 3.1 opens with "As at the date of this draft".
        {
          type: 'paragraph',
          text: '3.1. As at the date of this draft, the website presents information about KUKO WAY, practices, educational content, a topic library, progress tracking (“Your journey”), an account, and a community with discussions, courses and meetings. Some features require signing in or are still in development.',
        },
        {
          type: 'paragraph',
          text: [
            '3.2. The programs section presents planned one-off digital products: 1 Day Reset – 19 €, 3 Day Reset – 39 €, 7 Day Reset – 79 €, 28 Day Reset – 149 €. The prices and product descriptions shown are ',
            { text: 'information about offers in preparation', strong: true },
            ', insofar as the website marks them “In preparation” and “Test mode”. In Stripe test mode, no actual payment is made. A real sale arises only after the relevant product has been expressly activated and an order has been duly confirmed.',
          ],
        },
        {
          type: 'paragraph',
          text: '3.3. Also shown are a planned KUKO WAY Community membership (19 €/month or 190 €/year) and the KUKO WAY Trainer Program training (1490 €). While they are marked “Coming soon”, these offers are not a concluded contract and do not create an obligation to pay.',
        },
        {
          type: 'paragraph',
          text: '3.4. The final characteristics, access period, technical requirements, compatibility, functionality, renewal terms, price including applicable taxes and any additional charges are shown immediately before an obligation to pay arises.',
        },
      ],
    },
    {
      heading: '4. Accounts and eligibility',
      blocks: [
        {
          type: 'paragraph',
          text: [
            '4.1. ',
            // EDITORIAL [B] instruction or verification task addressed to the team: the bold label at the start of clause 4.1; the rest of 4.1 is clause text.
            { text: 'Proposed age policy, for confirmation by the team:', strong: true },
            ' independent registration and participation in personalised practices are offered to persons aged 18 or over. If the Platform is to accept minors, the requirements for age, parental involvement and safety must be revised ',
            { text: 'before', strong: true },
            ' this is activated.',
          ],
        },
        {
          type: 'paragraph',
          text: '4.2. The user provides up-to-date information, keeps their access credentials safe and gives immediate notice of any suspected unauthorised use. Impersonating another person or circumventing technical measures is not permitted.',
        },
        {
          type: 'paragraph',
          text: '4.3. Without registration, information about completed practices may be kept only in the browser used. With an account, history, notes and programs can be synchronised across devices, in accordance with the Privacy Policy.',
        },
        {
          type: 'paragraph',
          text: [
            '4.4. The user may request deletion of their account or data at ',
            { text: '[personal data email]', strong: true },
            ', or, where a built-in function exists, through it. Deleting an account and exercising the right of withdrawal from a paid purchase are separate actions.',
          ],
        },
      ],
    },
    {
      heading: '5. Health, personal responsibility and limits of the practices',
      blocks: [
        {
          type: 'paragraph',
          text: '5.1. KUKO WAY is a platform for education and general well-being, not a healthcare facility, a medical product or a substitute for medical diagnosis, treatment, psychotherapy or individual medical advice.',
        },
        {
          type: 'paragraph',
          text: '5.2. The movements, fascial practices, breathing exercises, stretching and other materials may not be suitable for everyone. In case of injury, illness, pregnancy, recent surgery, severe pain, dizziness, cardiovascular or respiratory complaints, or doubt about safety, the user should consult a qualified professional before taking part.',
        },
        {
          type: 'paragraph',
          text: '5.3. The user performs the movements within a comfortable range and stops in case of pain, weakness, numbness, difficulty breathing, dizziness or any other worrying symptom. Breathing should not be forced, and prolonged breath holds should not be performed without an individual assessment.',
        },
        {
          type: 'paragraph',
          text: '5.4. The Platform does not promise treatment, the elimination of any specific condition, a guaranteed result or the same effect for everyone. This section does not limit the Provider’s liability in cases where the law does not permit such a limitation.',
        },
      ],
    },
    {
      heading: '6. Community, discussions and meetings',
      blocks: [
        {
          type: 'paragraph',
          text: '6.1. Users may share opinions, questions and personal experience, provided they keep a respectful tone. Threats, harassment, discriminatory conduct, spam, fraud, unauthorised disclosure of other people’s personal data, copyright infringement and content contrary to the law are prohibited.',
        },
        {
          type: 'paragraph',
          text: '6.2. Posts and comments in public sections may be visible to other participants. Do not post diagnoses, medical documents, contact details or other sensitive information that you do not want to be accessible to the community.',
        },
        {
          type: 'paragraph',
          text: '6.3. The user retains their rights to their own original content and grants the Provider a non-exclusive, royalty-free right to store, display and technically process it only to the extent necessary for the relevant feature to work; any use beyond this requires an additional basis.',
        },
        {
          type: 'paragraph',
          text: [
            '6.4. Reports of illegal content or content that breaches the rules are submitted via ',
            { text: '[reporting address/form]', strong: true },
            ' with a link, a description and contact details. The Provider reviews reports without undue delay and communicates its decisions in accordance with the applicable Regulation (EU) 2022/2065 (Digital Services Act), insofar as the feature falls within its scope.',
          ],
        },
        {
          type: 'paragraph',
          text: '6.5. In the event of a breach, proportionate measures may be applied: a warning, hiding or removing content, a temporary posting ban or suspension of the account. Where a decision to restrict is taken, reasons and information about the available means of challenge are provided in accordance with applicable law.',
        },
        {
          type: 'paragraph',
          text: '6.6. Announced meetings and retreats are not confirmed bookings. For paid in-person events, separate detailed terms on the organiser, venue, price, cancellation and safety are published before purchase.',
        },
      ],
    },
    {
      heading: '7. Orders and payments — once sales are activated',
      blocks: [
        {
          type: 'paragraph',
          text: '7.1. Before a purchase is completed, the following are shown: the product, the duration and type of access, the full final price, the Provider’s details, the payment methods, the withdrawal conditions, the deadlines and other material restrictions. The final order button must clearly indicate an obligation to pay.',
        },
        {
          type: 'paragraph',
          text: '7.2. If payment processing is carried out by Stripe or another named provider, payment data is processed in accordance with that provider’s terms and the Privacy Policy; the Provider should not store full card data unless it has expressly and lawfully arranged such processing.',
        },
        {
          type: 'paragraph',
          text: [
            '7.3. After an order, the consumer receives confirmation on a durable medium (for example, by email) with information about the purchase, the terms and the required confirmations. Access is activated within the stated period; problems are reported to ',
            { text: '[customer service email]', strong: true },
            '.',
          ],
        },
        {
          type: 'paragraph',
          text: '7.4. If membership with recurring payment is activated, the billing period, the renewal terms, the exact way to cancel and when cancellation takes effect are stated expressly before subscribing. Deleting an account alone should not be presented as sufficient to stop a recurring payment if, technically, it is not.',
        },
      ],
    },
    {
      heading: '8. Right of withdrawal, refunds and statutory rights',
      blocks: [
        {
          type: 'paragraph',
          text: '8.1. In a distance contract with a consumer, there is, as a rule, a 14-day right of withdrawal, unless a statutory exception applies. The Provider provides pre-contractual information and a model withdrawal form in accordance with the Consumer Protection Act.',
        },
        {
          type: 'paragraph',
          text: [
            '8.2. For digital content that is not supplied on a tangible medium, the right of withdrawal may be lost only under the conditions provided by law, including express prior consent to begin performance within the 14-day period, acknowledgement of the consequences and due confirmation on a durable medium. ',
            { text: 'General acceptance of these Terms and Conditions does not replace these separate confirmations.', strong: true },
          ],
        },
        {
          type: 'paragraph',
          text: '8.3. For a digital service supplied continuously over a period, the rules are not the same as for digital content supplied once. Where the right of withdrawal is exercised, the consequences and any proportionate amount due are determined by law and the specific contract, and not by an automatic “no refunds” clause.',
        },
        {
          type: 'paragraph',
          text: [
            '8.4. The right of withdrawal may be exercised at ',
            { text: '[email]', strong: true },
            ', using the model form provided and, where applicable, through the clearly visible online function “Withdraw from the contract here”. Receipt of the withdrawal is confirmed on a durable medium. This is not the same as the ordinary cancellation of a future recurring membership.',
          ],
        },
        {
          type: 'paragraph',
          text: '8.5. Where digital content or a digital service is not supplied or does not conform, the consumer has the statutory rights under the Act on the Supply of Digital Content and Digital Services and the Sale of Goods, including the corresponding remedies. Nothing here excludes them.',
        },
      ],
    },
    {
      heading: '9. Voluntary support',
      blocks: [
        {
          type: 'paragraph',
          text: [
            '9.1. The “Support Us” button indicates an option to give voluntary financial support, ',
            { text: 'if this feature is actually active', strong: true },
            '. Before payment, the recipient, the legal nature (donation or other payment), the amount, the available methods and whether any right to something in return arises are stated.',
          ],
        },
        {
          type: 'paragraph',
          text: '9.2. No promise is made of tax relief, charitable status or a refund of the payment unless this has been verified for the specific recipient and the applicable law.',
        },
      ],
    },
    {
      heading: '10. Intellectual property',
      blocks: [
        {
          type: 'paragraph',
          text: '10.1. The texts, videos, photos, handbooks, programs, designs and trade marks of KUKO WAY are protected, unless expressly stated otherwise. The user receives a personal, non-exclusive right of lawful use within the purchased or freely provided access.',
        },
        {
          type: 'paragraph',
          text: '10.2. Unauthorised republication, sale, mass copying, sharing of paid access and use for one’s own commercial training without written permission are prohibited. Statutory exceptions, such as certain quotations, are preserved.',
        },
      ],
    },
    {
      heading: '11. Availability, changes and termination',
      blocks: [
        {
          type: 'paragraph',
          text: '11.1. The Provider may update the software and correct technical faults. For paid digital services, the applicable requirements for conformity, security and information about necessary updates are ensured.',
        },
        {
          type: 'paragraph',
          text: '11.2. Material adverse changes to existing paid contracts are made only under the conditions, and with the consumer rights, provided by law. Changes to the Terms and Conditions do not apply retroactively and do not take away statutory rights already acquired.',
        },
        {
          type: 'paragraph',
          text: '11.3. A user may close their free account. For paid access, the specific terms of the purchase and the statutory rights of withdrawal and termination apply.',
        },
      ],
    },
    {
      heading: '12. Data protection and cookies',
      blocks: [
        {
          type: 'paragraph',
          text: [
            '12.1. Data is processed in accordance with the ',
            { text: 'Privacy Policy', href: 'https://daily-trainer-app.vercel.app/privacy' },
            '. Information about the cookies used and storage in the browser is in the ',
            { text: 'Cookie Policy', href: 'https://daily-trainer-app.vercel.app/cookies' },
            '.',
          ],
        },
        {
          type: 'paragraph',
          text: '12.2. The processing of health data, where it is actually necessary and an appropriate legal basis exists, is governed separately and does not follow from acceptance of these Terms and Conditions.',
        },
      ],
    },
    {
      heading: '13. Complaints, disputes and applicable law',
      blocks: [
        {
          type: 'paragraph',
          text: [
            '13.1. For questions, objections and complaints: ',
            { text: '[contact email]', strong: true },
            ', ',
            { text: '[phone]', strong: true },
            ', ',
            { text: '[postal address]', strong: true },
            '. The Provider handles complaints in good faith within a reasonable time and in accordance with the applicable legal rules.',
          ],
        },
        {
          type: 'paragraph',
          text: '13.2. Consumers may contact the Commission for Consumer Protection (https://kzp.bg/) and, where applicable, the relevant alternative dispute resolution body. The European Online Dispute Resolution (ODR) platform was discontinued on 20 July 2025 and is not referred to as a working mechanism.',
        },
        {
          type: 'paragraph',
          text: '13.3. Bulgarian law applies, without depriving consumers of the mandatory protection under the law of the country of their habitual residence where that protection applies. The competent court is determined by the applicable rules and not unilaterally to the consumer’s detriment.',
        },
      ],
    },
    {
      heading: '14. Contacts and date',
      blocks: [
        {
          type: 'paragraph',
          text: [
            { text: 'Provider:', strong: true },
            ' 3DLOOK LTD',
            { lineBreak: true },
            { text: 'UIC:', strong: true },
            ' 175172901',
            { lineBreak: true },
            { text: 'Address:', strong: true },
            ' ',
            { text: 'ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2', strong: true },
            { lineBreak: true },
            { text: 'Email:', strong: true },
            ' [to be completed]',
            { lineBreak: true },
            { text: 'Phone:', strong: true },
            ' 0895720370',
            { lineBreak: true },
            { text: 'Effective date:', strong: true },
            ' [actual publication date]',
          ],
        },
      ],
    },
  ],
  // EDITORIAL [B] instruction or verification task addressed to the team: the note after the closing rule ("Important: Before publication, confirm ...").
  closing: [
    {
      type: 'paragraph',
      text: [
        { text: 'Important:', strong: true },
        ' Before publication, confirm the identity of the provider, the payment/donation mechanism, the age restrictions, the community rules and the actual logic for withdrawing from a purchase.',
      ],
    },
  ],
};
