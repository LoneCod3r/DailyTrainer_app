# legal module

Technical infrastructure for exactly three documents: **Terms & Conditions**
(`/terms`), **Privacy Policy** (`/privacy`) and **Cookie Policy** (`/cookies`),
plus cookie consent and registration agreements.

`content/*.bg.ts` holds the verbatim Bulgarian text of the source documents
(the only exception: in `terms.bg.ts` the brackets around the
client-confirmed provider details were removed with the client's
authorization)
in `terms and conditions, privacy policy и cookie policy/`
(`01_Obshti_usloviya.docx`, `02_Politika_poveritelnost.docx`,
`03_Politika_biskvitki.docx`, which stay unchanged). Passages that look like
internal editorial material are kept as supplied and marked with
`// EDITORIAL` comments until the owner/lawyer decide; open items are in
`PRE_PUBLICATION_CHECKLIST.md` (internal, never published). The texts still
have unfilled `[...]` fields and no English version, so every document here
is `status: 'draft'` and inactive, and every company detail is `null`. The
older `KUKO_WAY_Legal_Documents/DRAFT` package is not used.

| File | Purpose |
| --- | --- |
| `types.ts` | Document model: id, version, status, effectiveDate, bg/en content (title, info line, sections, quotes, closing; bold, monospace, links, line breaks) |
| `content/*.bg.ts` | Verbatim Bulgarian source text, converted from the .docx; editorial passages marked `// EDITORIAL` |
| `content/*.en.ts` | Unreviewed English translations; NOT connected to the registry (`en: null`), shown only in the development draft preview (`LEGAL_DRAFT_TRANSLATIONS` in `legal.service.ts`) |
| `PRE_PUBLICATION_CHECKLIST.md` | Internal: editorial passages, missing information, technical audit |
| `TRANSLATION_REVIEW.md` | Internal: translation decisions and questions for legal review |
| `documents.ts` | The registry. Approved text goes here (see its header for the steps) |
| `company.ts` | Operator details referenced as `{legalEntityName}` etc. All unset |
| `config.ts` | Environment switches: `LEGAL_DOCUMENTS_PUBLISHED`, `LEGAL_PRIVACY_ACKNOWLEDGEMENT`, `RECAPTCHA_CONSENT_CATEGORY` |
| `legal.service.ts` | Activation rules, rendering data, registration agreement checks |
| `cookie-consent.ts` | Consent categories and the `kw_cookie_consent` cookie format |
| `storage-inventory.ts` | Every cookie and localStorage key the app really uses, with its category |

UI: `components/legal/*` (provider, banner, settings dialog, footer, page
renderer, registration fields). DB: `LegalAgreement` (`legal_agreements`).

## When is a document active?

All of these must be true:

1. `LEGAL_DOCUMENTS_PUBLISHED=true` in the environment.
2. The document has `status: 'published'`, a `version` and an `effectiveDate`.
3. Approved content exists for **both** `bg` and `en`.
4. Every `{placeholder}` used in that content has a value in `company.ts`.
5. The content has no unresolved bracketed field such as `[●]` or `[имейл]`.

If (1) is on but anything else is missing, the document stays inactive and an
error is logged. A half-finished document is never shown.

While inactive, the page shows a neutral "not yet published" notice (`noindex`),
and registration neither shows nor requires nor records anything for it.

Once active:
- **Terms:** registration shows a required, unchecked checkbox. It is recorded as `ACCEPTED`.
- **Privacy:** a notice with a link, or a required checkbox when
  `LEGAL_PRIVACY_ACKNOWLEDGEMENT=checkbox`. It is recorded as `ACKNOWLEDGED`.
- Each row stores user, document type, version, UI language, source and timestamp.
  It is written in the same database write as the new user.
- The server rejects a submission whose version doesn't match the current one.

Publishing a changed text requires a **new version**. Agreements point at
versions, so the text behind an existing version must never change.

## Cookie consent

The choice is stored in the first-party cookie `kw_cookie_consent`
(necessary; 180 days). It is tied to the Cookie Policy `version`, so a new
version asks visitors again.

The categories are: necessary (always on), preferences, analytics and
marketing. All optional categories are off until explicitly allowed. The app
loads no analytics or marketing scripts.

To add something optional later:
- list it in `storage-inventory.ts`;
- gate it with `useLegal().hasConsent('<category>')`, or by listening for the
  `kw:cookie-consent-change` window event;
- bump the Cookie Policy version if visitors must be asked again.
