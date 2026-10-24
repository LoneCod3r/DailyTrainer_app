// Legal document model (Terms & Conditions, Privacy Policy, Cookie Policy).
// Pure types/constants, with no server-only dependencies, so client
// components can import them too.
//
// Wording comes ONLY from the supplied source documents, verbatim, and is
// shown only once the owner and a lawyer have approved it (see documents.ts).
// This module models the structure that text is rendered into; it never
// supplies the text itself.
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

// A run of text with the source document's own inline formatting: bold
// (`strong`), monospace names such as cookie keys (`code`) and hyperlinks
// (`href`, exactly as in the source). `lineBreak` is a line break inside a
// paragraph, not a new paragraph.
export type LegalInline =
  | string
  | { text: string; strong?: boolean; code?: boolean; href?: string }
  | { lineBreak: true };

// Plain text, or a sequence of formatted runs when the source formats part
// of it. Strings may reference company details as `{legalEntityName}`,
// `{contactEmail}`, ... (see company.ts). They are filled in at render time,
// so those facts live in one place instead of being copied into every
// document and language.
export type LegalText = string | LegalInline[];

// A block of approved text. `blockquote` is a paragraph the source sets off
// as a block quotation. `internal: true` marks a whole block that the source
// addresses to the team (e.g. „За екипа, не за публикуване“ or a
// pre-publication checklist): it is never part of the public document, is
// left out of the publication checks, and is shown only in the
// development-only draft preview, labelled as internal.
export type LegalContentBlock =
  | { type: 'paragraph'; text: LegalText; internal?: boolean }
  | { type: 'list'; items: LegalText[]; internal?: boolean }
  | { type: 'blockquote'; text: LegalText; internal?: boolean };

export interface LegalContentSection {
  heading: string;
  blocks: LegalContentBlock[];
}

export interface LegalDocumentContent {
  // The document's own title. When set, it is the page heading in place of
  // the short title used in navigation, so the title never appears twice.
  title?: string;
  // The source document's own version/date/status line. It is draft
  // metadata ("Версия: проект 1.0 … Статус: проект …"): shown only in the
  // development-only draft preview. A published page shows the registry's
  // "Version · Effective from" line instead.
  info?: LegalText;
  // Optional intro shown above the first section.
  intro?: LegalContentBlock[];
  sections: LegalContentSection[];
  // Blocks after the document's closing horizontal rule, outside the last
  // section.
  closing?: LegalContentBlock[];
}

export interface LegalDocument {
  id: LegalDocumentId;
  // The approved version identifier, e.g. "1.0". It is stored with every
  // user agreement, so it must change whenever the approved text changes.
  version: string;
  status: LegalDocumentStatus;
  // ISO date (YYYY-MM-DD) from which this version applies. Null until approved.
  effectiveDate: string | null;
  // Source text per language. Null means there is no text in that language.
  // A document can only be active when every language is filled in, so BG
  // and EN can't drift apart (README: "Keeping BG and EN synchronized").
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
