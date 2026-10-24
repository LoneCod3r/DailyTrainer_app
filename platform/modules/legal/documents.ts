// The one registry of KUKO WAY's legal documents: Terms & Conditions,
// Privacy Policy, Cookie Policy.
//
// CURRENT STATE: all three are status 'draft'. Each holds the shortened,
// public-only Bulgarian text (content/*.bg.ts) prepared from the source
// documents in `terms and conditions, privacy policy и cookie policy/`, and
// its English version (content/*.en.ts). They are shown only in the
// development draft preview. The draft status keeps all three inactive
// (legal.service.ts): Privacy §3, §4 and §9 describe check-in consent and a
// 12-month retention that production does not have yet. What must still be confirmed before
// activation is listed in CLIENT_CONFIRMATION.md (internal). Nothing is
// copied from the older, unapproved KUKO_WAY_Legal_Documents/DRAFT package.
//
// `version` stays '0.1-draft' on purpose: the Cookie Policy version is also
// the cookie-consent version (cookie-consent.ts), so changing it would ask
// every visitor for their cookie choice again.
//
// TO ACTIVATE A DOCUMENT once its final text is approved by the owner AND a
// lawyer:
//   1. Put the approved BG and EN text in `content` (both are required). Use
//      `{legalEntityName}`-style tokens for company facts (see company.ts).
//   2. Set `version` to the approved version and `effectiveDate` (YYYY-MM-DD).
//   3. Set `status: 'published'`.
//   4. Fill in every company.ts value the text references.
//   5. Set LEGAL_DOCUMENTS_PUBLISHED=true in the environment (config.ts).
// Changing the text of a published document requires a NEW `version`: users'
// recorded agreements point at a version, so the text behind a version must
// never change silently.
import { COOKIES_BG } from './content/cookies.bg';
import { COOKIES_EN } from './content/cookies.en';
import { PRIVACY_BG } from './content/privacy.bg';
import { PRIVACY_EN } from './content/privacy.en';
import { TERMS_BG } from './content/terms.bg';
import { TERMS_EN } from './content/terms.en';
import type { LegalDocument, LegalDocumentId } from './types';

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  terms: {
    id: 'terms',
    version: '0.1-draft',
    status: 'draft',
    effectiveDate: null,
    content: { bg: TERMS_BG, en: TERMS_EN },
  },
  privacy: {
    id: 'privacy',
    version: '0.1-draft',
    status: 'draft',
    effectiveDate: null,
    content: { bg: PRIVACY_BG, en: PRIVACY_EN },
  },
  cookies: {
    id: 'cookies',
    version: '0.1-draft',
    status: 'draft',
    effectiveDate: null,
    content: { bg: COOKIES_BG, en: COOKIES_EN },
  },
};
