// The one registry of KUKO WAY's legal documents: Terms & Conditions,
// Privacy Policy, Cookie Policy.
//
// CURRENT STATE: all three are status 'published', version 1.0, effective
// 24.10.2026 (client decision: publish the shortened texts now and refine
// them later). Each holds the shortened, public-only Bulgarian text
// (content/*.bg.ts) prepared from the source documents in `terms and
// conditions, privacy policy и cookie policy/`, and its English version
// (content/*.en.ts). They are served only while LEGAL_DOCUMENTS_PUBLISHED is
// true (config.ts). Open items for later versions are listed in
// CLIENT_CONFIRMATION.md (internal). Nothing is copied from the older,
// unapproved KUKO_WAY_Legal_Documents/DRAFT package.
//
// The Cookie Policy version is also the cookie-consent version
// (cookie-consent.ts): a new version asks every visitor for their cookie
// choice again.
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
    version: '1.0',
    status: 'published',
    effectiveDate: '2026-10-24',
    content: { bg: TERMS_BG, en: TERMS_EN },
  },
  privacy: {
    id: 'privacy',
    version: '1.0',
    status: 'published',
    effectiveDate: '2026-10-24',
    content: { bg: PRIVACY_BG, en: PRIVACY_EN },
  },
  cookies: {
    id: 'cookies',
    version: '1.0',
    status: 'published',
    effectiveDate: '2026-10-24',
    content: { bg: COOKIES_BG, en: COOKIES_EN },
  },
};
