// Legal document model (Terms & Conditions, Privacy Policy, Cookie Policy).
// Pure types/constants, with no server-only dependencies, so client
// components can import them too.
//
// Wording comes ONLY from the owner- and lawyer-approved final text (see
// KUKO_WAY_Legal_Documents/README.md). This module models the structure
// that text is rendered into; it never supplies the text itself.
import type { Locale } from '@/lib/i18n/locale';

export type LegalDocumentId = 'terms' | 'privacy' | 'cookies';

export const LEGAL_DOCUMENT_IDS: LegalDocumentId[] = ['terms', 'privacy', 'cookies'];

// Public route for each document.
export const LEGAL_DOCUMENT_PATHS: Record<LegalDocumentId, string> = {
  terms: '/terms',
  privacy: '/privacy',
  cookies: '/cookies',
};

// 'draft' means the text is not approved, and the document is never shown or
// enforced while in that state. 'published' means the owner AND a lawyer have
// approved this exact version. Even then, the document only becomes active
// when the global LEGAL_DOCUMENTS_PUBLISHED switch is also on (see
// modules/legal/config.ts).
export type LegalDocumentStatus = 'draft' | 'published';

// A block of approved text. Strings may reference company details as
// `{legalEntityName}`, `{contactEmail}`, ... (see company.ts). They are
// filled in at render time, so those facts live in one place instead of
// being copied into every document and language.
export type LegalContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export interface LegalContentSection {
  heading: string;
  blocks: LegalContentBlock[];
}

export interface LegalDocumentContent {
  // Optional intro shown above the first section.
  intro?: LegalContentBlock[];
  sections: LegalContentSection[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  // The approved version identifier, e.g. "1.0". It is stored with every
  // user agreement, so it must change whenever the approved text changes.
  version: string;
  status: LegalDocumentStatus;
  // ISO date (YYYY-MM-DD) from which this version applies. Null until approved.
  effectiveDate: string | null;
  // Approved text per language. Null means no approved text yet. A document
  // can only be active when every language is filled in, so BG and EN can't
  // drift apart (README: "Keeping BG and EN synchronized").
  content: Record<Locale, LegalDocumentContent | null>;
}

// Serializable, client-safe summary of one document's runtime state.
export interface LegalDocumentState {
  id: LegalDocumentId;
  version: string;
  active: boolean;
  effectiveDate: string | null;
  path: string;
}
