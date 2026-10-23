# Legal translations: internal review notes

> INTERNAL. Not for publication. Not shown on the website.

Covers the unreviewed English translations in `content/terms.en.ts`,
`content/privacy.en.ts` and `content/cookies.en.ts` (23.10.2026). They are
not connected to the registry (`documents.ts` keeps `en: null`), so the
website never renders them. They need review by the owner and a lawyer
before use.

Sources: the current Bulgarian DOCX files in `terms and conditions, privacy
policy и cookie policy/` and the matching `content/*.bg.ts`. The older
drafts in `KUKO_WAY_Legal_Documents/DRAFT/` were not used.

## Confirmed Terms details (both languages)

On the client's explicit authorization, the square brackets around the
confirmed details were removed in `terms.bg.ts` and `terms.en.ts`; the
values themselves are unchanged:

| Where | Value |
| --- | --- |
| 1.2 company name (never in brackets) | 3Д ЛУК ООД |
| 1.2 and 14: UIC (ЕИК/БУЛСТАТ) | 175172901 |
| 1.2: registered office and management address; correspondence address; 14: address | ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2 |
| 1.2 and 14: phone | 0895720370 |
| 1.2: VAT number | BG175172901 |
| 14: company name | 3DLOOK LTD |

This is the only deliberate difference between `terms.bg.ts` and the DOCX
(the DOCX still has the brackets).

## Points for legal review

1. **Personal Data Protection Act (ZZLD), чл. 25в** (Privacy, section 11):
   rendered as "Art. 25c of the Personal Data Protection Act (ZZLD)". No
   official English translation of the ZZLD exists; secondary GDPR sources
   cite the provision on children's consent (age 14) as "Article 25c", but
   that is not authoritative. Confirm the citation.
2. **Terms 4.1, „преди активирането им“**: grammatically "им" could refer to
   the revised requirements or to the acceptance of minors. Translated as
   "before this is activated", i.e. before the Platform starts accepting
   minors, which fits the sentence's purpose. Confirm.
3. **Terms 5.1, „медицински продукт“**: kept as "medical product". It is not
   a standard Bulgarian legal term: a medical device is „медицинско
   изделие“ and a medicinal product (a drug) is „лекарствен продукт“. For a
   software platform the relevant regulatory concept is most likely
   "medical device" (Regulation (EU) 2017/745), but changing it would change
   the meaning of the source. Decide whether the Bulgarian should say
   „медицинско изделие“; the English would then follow.
4. **Terms 8.4, „Откажете се от договора тук“**: rendered as "Withdraw from
   the contract here". This is the Bulgarian wording required for the online
   withdrawal function, not an existing interface label; confirm the
   English wording to use (and keep it identical to any future button).
5. **Terms 1.3, language**: the Terms say the documents are provided in clear
   Bulgarian; there is no clause on which language version prevails if the
   Bulgarian and English texts differ. Nothing was added. Decide whether a
   precedence clause is needed before the English goes live.
6. **Company names**: „3Д ЛУК ООД“ (1.2) and „3DLOOK LTD“ (14) are both kept
   exactly as approved, in both languages. Confirm at final review whether
   the two forms are intended (e.g. Bulgarian name and its Latin
   transliteration).
7. **Interface labels**: where the source quotes interface labels, the
   English uses the actual English labels of the application
   (`lib/i18n/dictionaries/en.ts`): "In preparation", "Test mode", "Coming
   soon", "Support Us", "Your journey", "Customize", "Reject optional",
   "Accept all", "Cookie settings", "Preferences", "Analytics",
   "Marketing". „Приемам общите условия“ (Privacy 3) is rendered generically
   as "I accept the Terms and Conditions".

## Terminology used across the three translations

| Bulgarian | English |
| --- | --- |
| потребител | **consumer** in consumer-law clauses (Terms 7.3, 8.1, 8.5, 11.2, 13.2, 13.3); **user** elsewhere |
| Доставчикът | the Provider |
| Платформата | the Platform |
| профил | account |
| Общи условия | Terms and Conditions |
| ЕИК/БУЛСТАТ; ЕИК | UIC/BULSTAT; UIC |
| договор от разстояние | distance contract |
| право на отказ | right of withdrawal |
| траен носител | durable medium |
| императивно законодателство / императивни права | mandatory law / mandatory rights |
| администратор (на лични данни) | controller |
| Комисия за защита на потребителите | Commission for Consumer Protection |
| Комисия за защита на личните данни | Commission for Personal Data Protection |
| Закон за защита на потребителите | Consumer Protection Act |
| Закон за предоставяне на цифрово съдържание и цифрови услуги и за продажба на стоки | Act on the Supply of Digital Content and Digital Services and the Sale of Goods |
| Акт за цифровите услуги | Digital Services Act |
| чл. 6(1)(б), (в), (е); чл. 9(2)(а) | Art. 6(1)(b), (c), (f); Art. 9(2)(a) |
| бисквитки; локално съхранение | cookies; local storage |

## Unresolved placeholders

All keep their brackets in both languages and still block publication; in
English only the label is translated (mapping checked in
`tests/legal-translations.test.ts`).

- **Terms:** 1.2 email `[●]`; 4.4 `[personal data email]`; 6.4
  `[reporting address/form]`; 7.3 `[customer service email]`; 8.4
  `[email]`; 13.1 `[contact email]`, `[phone]`, `[postal address]`; 14
  email `[to be completed]` and `[actual publication date]`.
- **Privacy:** 1 `[EXACT LEGAL ENTITY]`, UIC, address, email, phone `[●]`,
  DPO `[●/not applicable]`; 8 `[to be completed after a technical audit]`;
  9 four retention periods; 10 `[GDPR email]`; 13 the bracketed team note;
  14 controller, address, email, phone, effective date `[●]`; intro note
  `[●]`.
- **Cookies:** 2 `[EXACT LEGAL ENTITY]`, UIC `[●]`, contact `[email]`; 8
  `[email]`, `[actual publication date]`, controller `[●]`, contact `[●]`.

## Privacy and Cookie Policy fields the confirmed details might fill

Not changed: their DOCX sources have not been updated or approved with these
details, and the controller of personal data is not necessarily the same
entity, or the same contact point, as the provider in the Terms (Privacy 1:
the controller "is not automatically identified with the KUKO WAY trade
mark").

| Document, place | Placeholder | Candidate (only if confirmed for this field) |
| --- | --- | --- |
| Privacy 1 | `[ТОЧНО ЮРИДИЧЕСКО ЛИЦЕ]` | 3Д ЛУК ООД or 3DLOOK LTD (which form?) |
| Privacy 1 | ЕИК/БУЛСТАТ `[●]` | 175172901 |
| Privacy 1 | адрес `[●]` | ж.к. Хр. Смирненски, блок 31б, вх. Б, ет. 2 |
| Privacy 1 | телефон `[●]` | 0895720370 |
| Privacy 14 | Администратор, Адрес, Телефон `[●]` | as in Privacy 1 |
| Cookies 2 | `[ТОЧНО ЮРИДИЧЕСКО ЛИЦЕ]`, ЕИК `[●]` | company name, 175172901 |
| Cookies 8 | Администратор `[●]` | company name |
| Cookies 8 | Контакт `[●]` | unclear: phone, or an email still to be provided |

Cannot be filled from the confirmed details: every email field, the DPO,
transfers, retention periods, the effective dates and the reporting
address/form.
