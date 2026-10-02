// Decides which legal documents are active and builds the agreement records
// stored at registration. It has no framework/HTTP concerns, so it can be
// unit-tested directly.
import { LOCALES, type Locale } from '@/lib/i18n/locale';
import { Errors } from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import type { RegisterInput } from '@/lib/validations/auth';
import { COMPANY_INFO, type CompanyInfo } from './company';
import { LEGAL_DOCUMENTS } from './documents';
import {
  getPrivacyAcknowledgementMode,
  getRecaptchaConsentCategory,
  isLegalPublishingEnabled,
  type PrivacyAcknowledgementMode,
} from './config';
import type { CookieCategory } from './cookie-consent';
import {
  LEGAL_DOCUMENT_IDS,
  LEGAL_DOCUMENT_PATHS,
  type LegalContentBlock,
  type LegalDocument,
  type LegalDocumentContent,
  type LegalDocumentId,
  type LegalDocumentState,
} from './types';

const log = createLogger('legal');

const TOKEN = /\{(\w+)\}/g;

function blockStrings(block: LegalContentBlock): string[] {
  return block.type === 'paragraph' ? [block.text] : block.items;
}

function contentStrings(content: LegalDocumentContent): string[] {
  return [
    ...(content.intro ?? []).flatMap(blockStrings),
    ...content.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap(blockStrings)]),
  ];
}

// Lists every reason a document can't be active. An empty list means it is
// ready, as long as the global switch is also on.
export function validateLegalDocument(doc: LegalDocument, company: CompanyInfo = COMPANY_INFO): string[] {
  const problems: string[] = [];
  if (doc.status !== 'published') problems.push('status is not "published"');
  if (!doc.version.trim()) problems.push('version is empty');
  if (!doc.effectiveDate || Number.isNaN(Date.parse(doc.effectiveDate))) problems.push('effectiveDate is missing or invalid');

  for (const locale of LOCALES) {
    const content = doc.content[locale];
    if (!content || content.sections.length === 0) {
      problems.push(`no approved ${locale} content`);
      continue;
    }
    for (const text of contentStrings(content)) {
      for (const [, key] of text.matchAll(TOKEN)) {
        if (!(key in company)) problems.push(`${locale}: unknown placeholder {${key}}`);
        else if (!company[key as keyof CompanyInfo]) problems.push(`${locale}: company value "${key}" is not set (company.ts)`);
      }
    }
  }
  return [...new Set(problems)];
}

export function isLegalDocumentActive(id: LegalDocumentId): boolean {
  if (!isLegalPublishingEnabled()) return false;
  const doc = LEGAL_DOCUMENTS[id];
  const problems = validateLegalDocument(doc);
  if (problems.length > 0) {
    // Publishing was switched on but this document isn't ready. Fail safe
    // (treat it as inactive) and say why, instead of showing a half-filled
    // document.
    if (doc.status === 'published') log.error('legal document marked published but not activatable', { id, problems });
    return false;
  }
  return true;
}

export function getLegalDocumentState(id: LegalDocumentId): LegalDocumentState {
  const doc = LEGAL_DOCUMENTS[id];
  const active = isLegalDocumentActive(id);
  return {
    id,
    version: doc.version,
    active,
    effectiveDate: active ? doc.effectiveDate : null,
    path: LEGAL_DOCUMENT_PATHS[id],
  };
}

export function interpolateCompanyInfo(text: string, company: CompanyInfo = COMPANY_INFO): string {
  return text.replace(TOKEN, (match, key: string) => {
    const value = key in company ? company[key as keyof CompanyInfo] : null;
    return value ?? match;
  });
}

function interpolateBlock(block: LegalContentBlock): LegalContentBlock {
  return block.type === 'paragraph'
    ? { type: 'paragraph', text: interpolateCompanyInfo(block.text) }
    : { type: 'list', items: block.items.map((i) => interpolateCompanyInfo(i)) };
}

// The renderable, company-filled content of an ACTIVE document, or null when
// the document isn't active. Pages render nothing from the document unless
// this returns non-null.
export function getActiveLegalDocument(
  id: LegalDocumentId,
  locale: Locale,
): { version: string; effectiveDate: string; content: LegalDocumentContent } | null {
  if (!isLegalDocumentActive(id)) return null;
  const doc = LEGAL_DOCUMENTS[id];
  const content = doc.content[locale]!;
  return {
    version: doc.version,
    effectiveDate: doc.effectiveDate!,
    content: {
      intro: content.intro?.map(interpolateBlock),
      sections: content.sections.map((s) => ({
        heading: interpolateCompanyInfo(s.heading),
        blocks: s.blocks.map(interpolateBlock),
      })),
    },
  };
}

// Everything the client needs (footer, cookie banner, registration form),
// as plain serializable data. The root layout computes it once per request.
export interface PublicLegalConfig {
  documents: Record<LegalDocumentId, LegalDocumentState>;
  registration: {
    termsRequired: boolean;
    termsVersion: string | null;
    privacyRequired: boolean;
    privacyVersion: string | null;
    privacyMode: PrivacyAcknowledgementMode;
  };
  // The stored cookie choice is tied to this version. A new Cookie Policy
  // version asks visitors again.
  cookiePolicyVersion: string;
  recaptchaCategory: CookieCategory;
}

export function getPublicLegalConfig(): PublicLegalConfig {
  const documents = Object.fromEntries(LEGAL_DOCUMENT_IDS.map((id) => [id, getLegalDocumentState(id)])) as Record<
    LegalDocumentId,
    LegalDocumentState
  >;
  return {
    documents,
    registration: {
      termsRequired: documents.terms.active,
      termsVersion: documents.terms.active ? documents.terms.version : null,
      privacyRequired: documents.privacy.active,
      privacyVersion: documents.privacy.active ? documents.privacy.version : null,
      privacyMode: getPrivacyAcknowledgementMode(),
    },
    cookiePolicyVersion: LEGAL_DOCUMENTS.cookies.version,
    recaptchaCategory: getRecaptchaConsentCategory(),
  };
}

// --- Registration agreements --------------------------------------------------

export type LegalAgreementRecord = {
  documentType: 'TERMS' | 'PRIVACY';
  documentVersion: string;
  action: 'ACCEPTED' | 'ACKNOWLEDGED';
  locale: Locale;
  source: 'REGISTRATION';
  acceptedAt: Date;
};

// Checks the registration form's legal fields against the documents that
// are active right now, and returns the agreement rows to store with the new
// user. Returns [] while nothing is active: drafts are never required or
// recorded. Throws a 400 when an active document wasn't agreed to, or when
// the form showed an older version than the current one (the visitor must
// see the current text before agreeing to it).
export function resolveRegistrationAgreements(
  consent: RegisterInput['legalConsent'],
  locale: Locale,
  now: Date = new Date(),
): LegalAgreementRecord[] {
  const records: LegalAgreementRecord[] = [];
  const base = { locale, source: 'REGISTRATION' as const, acceptedAt: now };

  if (isLegalDocumentActive('terms')) {
    const { version } = LEGAL_DOCUMENTS.terms;
    if (consent?.termsAccepted !== true) {
      throw Errors.badRequest('You must accept the Terms & Conditions to create an account.');
    }
    if (consent.termsVersion !== version) {
      throw Errors.badRequest('The Terms & Conditions have been updated. Please reload the page and review them.');
    }
    records.push({ ...base, documentType: 'TERMS', documentVersion: version, action: 'ACCEPTED' });
  }

  if (isLegalDocumentActive('privacy')) {
    const { version } = LEGAL_DOCUMENTS.privacy;
    if (getPrivacyAcknowledgementMode() === 'checkbox' && consent?.privacyAcknowledged !== true) {
      throw Errors.badRequest('Please confirm that you have read the Privacy Policy.');
    }
    if (consent?.privacyVersion !== version) {
      throw Errors.badRequest('The Privacy Policy has been updated. Please reload the page and review it.');
    }
    records.push({ ...base, documentType: 'PRIVACY', documentVersion: version, action: 'ACKNOWLEDGED' });
  }

  return records;
}
