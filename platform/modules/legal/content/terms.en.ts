// Terms & Conditions, English version of ./terms.bg.ts (the primary
// Bulgarian text), matching it section by section and block by block.
//
// Connected to the registry (documents.ts) but, like the Bulgarian text, a
// draft: it is not active and only appears in the development-only draft
// preview. Its legal approval status must be confirmed before publication
// (../CLIENT_CONFIRMATION.md).
// The company name and the address stay in Bulgarian as officially given;
// "3DLOOK LTD" is the Latin form used in the source DOCX (to be confirmed,
// see ../CLIENT_CONFIRMATION.md). Interface labels match
// lib/i18n/dictionaries/en.ts.
import type { LegalDocumentContent } from '../types';

export const TERMS_EN: LegalDocumentContent = {
  title: 'TERMS AND CONDITIONS OF USE OF KUKO WAY',
  sections: [
    {
      heading: '1. Provider',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'KUKO WAY (the "Platform") is provided by ',
            { text: '3Д ЛУК ООД', strong: true },
            ' (3DLOOK LTD), UIC 175172901, VAT No. BG175172901, registered office, management address and correspondence address: ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2, telephone 0895720370 (the "Provider", "we").',
          ],
        },
      ],
    },
    {
      heading: '2. Scope and acceptance',
      blocks: [
        {
          type: 'paragraph',
          text: '2.1. The Platform offers practices for movement, breathing and body awareness, educational content, programs, progress tracking and a community with discussions.',
        },
        {
          type: 'paragraph',
          text: '2.2. Public pages can be viewed without an account. An account is required to save progress to an account, to use programs and to take part in the community.',
        },
        {
          type: 'paragraph',
          text: '2.3. When you register, you accept these Terms through a separate checkbox that is not pre-ticked. This acceptance is not consent to the processing of health data or to optional cookies.',
        },
        {
          type: 'paragraph',
          text: '2.4. Only persons aged 18 or over may register. By registering, you confirm that you meet this requirement.',
        },
      ],
    },
    {
      heading: '3. Your account',
      blocks: [
        {
          type: 'paragraph',
          text: '3.1. Provide accurate information, keep your password safe and tell us immediately if you suspect unauthorised access. You must not impersonate anyone or circumvent the technical safeguards of the Platform.',
        },
        {
          type: 'paragraph',
          text: '3.2. Without an account, completed practices are stored only in your browser. With an account, your history, notes and program progress are stored in your account and are available on different devices.',
        },
        {
          type: 'paragraph',
          text: '3.3. You can ask us at any time to delete your account using the contact details in clause 1.',
        },
      ],
    },
    {
      heading: '4. Health and safety',
      blocks: [
        {
          type: 'paragraph',
          text: '4.1. KUKO WAY is an educational platform for general wellbeing. It is not a medical service or a medical device and does not replace diagnosis, treatment, psychotherapy or individual advice from a professional.',
        },
        {
          type: 'paragraph',
          text: '4.2. The practices may not be suitable for everyone. If you have an injury or illness, are pregnant, have had recent surgery, have severe pain or cardiovascular or respiratory complaints, or are unsure, consult a qualified professional before you start.',
        },
        {
          type: 'paragraph',
          text: '4.3. Move within a comfortable range, do not force your breathing, and stop immediately if you feel pain, weakness, dizziness, numbness, shortness of breath or any other worrying symptom.',
        },
        {
          type: 'paragraph',
          text: '4.4. We do not promise any cure or particular result. This clause does not limit our liability where the law does not allow it to be limited.',
        },
      ],
    },
    {
      heading: '5. Community',
      blocks: [
        {
          type: 'paragraph',
          text: "5.1. Be respectful. Threats, harassment, discrimination, spam, fraud, disclosing other people's personal data, copyright infringement and any other illegal content are prohibited.",
        },
        {
          type: 'paragraph',
          text: '5.2. Discussions and replies, together with your name as their author, may be visible to all visitors to the site. Do not share diagnoses, medical records, contact details or other information you do not want to be public.',
        },
        {
          type: 'paragraph',
          text: '5.3. You keep the rights to your content. You grant us a free, non-exclusive right to store, display and technically process it as far as necessary to run the community.',
        },
        {
          type: 'paragraph',
          text: '5.4. You can report illegal content or content that breaks these rules with the "Report" button (for signed-in users) or using the contact details in clause 1, stating where the content is and why you are reporting it. We handle reports without undue delay and tell the person who reported the content our decision.',
        },
        {
          type: 'paragraph',
          text: '5.5. If the rules are broken, we may issue a warning, hide or remove content, or suspend an account. We will tell you our decision and the reasons for it. You can contest it using the contact details in clause 1.',
        },
      ],
    },
    {
      heading: '6. Payments',
      blocks: [
        {
          type: 'paragraph',
          text: 'At present, no products can be bought on the Platform and no payments or donations are accepted. If this changes, the terms, including the price and the right of withdrawal, will be provided before you order.',
        },
      ],
    },
    {
      heading: '7. Intellectual property',
      blocks: [
        {
          type: 'paragraph',
          text: "KUKO WAY's texts, videos, photos, programs, design and trade marks are protected. You may use them only for personal, non-commercial purposes. Without our written permission you may not copy, distribute or sell them, or use them to teach others, except where the law allows it.",
        },
      ],
    },
    {
      heading: '8. Changes and termination',
      blocks: [
        {
          type: 'paragraph',
          text: '8.1. We may change the Platform and these Terms. We will notify registered users of material changes in advance and in an appropriate way. Changes do not apply retroactively.',
        },
        {
          type: 'paragraph',
          text: '8.2. You can stop using the Platform at any time and ask us to delete your account (clause 3.3). We may suspend an account for a serious or repeated breach of these Terms (clause 5.5).',
        },
      ],
    },
    {
      heading: '9. Personal data and cookies',
      blocks: [
        {
          type: 'paragraph',
          text: [
            'How we process personal data is described in our ',
            { text: 'Privacy Policy', href: '/privacy' },
            ', and cookies and local storage in our ',
            { text: 'Cookie Policy', href: '/cookies' },
            '.',
          ],
        },
      ],
    },
    {
      heading: '10. Complaints, governing law and language',
      blocks: [
        {
          type: 'paragraph',
          text: '10.1. You can send questions and complaints to the contact details in clause 1. You may also contact the Bulgarian Commission for Consumer Protection (kzp.bg).',
        },
        {
          type: 'paragraph',
          text: '10.2. Bulgarian law applies. This does not deprive you of the mandatory protection given to you by the law of the country where you habitually reside, and does not limit your statutory rights as a consumer. The competent court is determined by the applicable rules.',
        },
        {
          type: 'paragraph',
          text: '10.3. These Terms were drawn up in Bulgarian. If this English translation differs, the Bulgarian text prevails.',
        },
      ],
    },
  ],
};
