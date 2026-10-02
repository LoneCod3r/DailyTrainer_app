// The one registry of KUKO WAY's legal documents: Terms & Conditions,
// Privacy Policy, Cookie Policy.
//
// CURRENT STATE: all three are status 'draft' with no content. The drafts
// in KUKO_WAY_Legal_Documents/DRAFT are marked "NOT APPROVED — DO NOT
// IMPLEMENT", so none of their wording is copied here.
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
import type { LegalDocument, LegalDocumentId } from './types';

export const LEGAL_DOCUMENTS: Record<LegalDocumentId, LegalDocument> = {
  terms: {
    id: 'terms',
    version: '0.1-draft',
    status: 'draft',
    effectiveDate: null,
    content: { bg: null, en: null },
  },
  privacy: {
    id: 'privacy',
    version: '0.1-draft',
    status: 'draft',
    effectiveDate: null,
    content: { bg: null, en: null },
  },
  cookies: {
    id: 'cookies',
    version: '0.1-draft',
    status: 'draft',
    effectiveDate: null,
    content: { bg: null, en: null },
  },
};
