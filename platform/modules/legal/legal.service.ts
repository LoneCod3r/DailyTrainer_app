// Decides which legal documents are active and builds the agreement records
// stored at registration. It has no framework/HTTP concerns, so it can be
// unit-tested directly.
import { LOCALES, type Locale } from '@/lib/i18n/locale';
import { Errors } from '@/lib/api-response';
import { createLogger } from '@/lib/logger';
import type { RegisterInput } from '@/lib/validations/auth';
import { COMPANY_INFO, type CompanyInfo } from './company';
import { COOKIES_EN } from './content/cookies.en';
import { PRIVACY_EN } from './content/privacy.en';
import { TERMS_EN } from './content/terms.en';
import { LEGAL_DOCUMENTS } from './documents';
import {
  getPrivacyAcknowledgementMode,
  getRecaptchaConsentCategory,
  isLegalDraftPreviewAllowed,
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
  type LegalText,
} from './types';

const log = createLogger('legal');

const TOKEN = /\{(\w+)\}/g;

// A bracketed field the source document leaves to be filled in, such as
// `[●]` or `[имейл]`. Approved text must not contain any.
const UNRESOLVED_FIELD = /\[[^\]]*\]/g;

function textStrings(text: LegalText): string[] {
  if (typeof text === 'string') return [text];
  return text.flatMap((run) => (typeof run === 'string' ? [run] : 'text' in run ? [run.text] : []));
}

function blockStrings(block: LegalContentBlock): string[] {
  return block.type === 'list' ? block.items.flatMap(textStrings) : textStrings(block.text);
}

function contentStrings(content: LegalDocumentContent): string[] {
  return [
    ...(content.title ? [content.title] : []),
    ...(content.info ? textStrings(content.info) : []),
    ...(content.intro ?? []).flatMap(blockStrings),
    ...content.sections.flatMap((s) => [s.heading, ...s.blocks.flatMap(blockStrings)]),
    ...(content.closing ?? []).flatMap(blockStrings),
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
      for (const [field] of text.matchAll(UNRESOLVED_FIELD)) problems.push(`${locale}: unresolved field ${field}`);
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

function interpolateText(text: LegalText): LegalText {
  if (typeof text === 'string') return interpolateCompanyInfo(text);
  return text.map((run) =>
    typeof run === 'string'
      ? interpolateCompanyInfo(run)
      : 'text' in run
        ? { ...run, text: interpolateCompanyInfo(run.text) }
        : run,
  );
}

function interpolateBlock(block: LegalContentBlock): LegalContentBlock {
  return block.type === 'list'
    ? { type: 'list', items: block.items.map(interpolateText) }
    : { type: block.type, text: interpolateText(block.text) };
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
      title: content.title && interpolateCompanyInfo(content.title),
      info: content.info && interpolateText(content.info),
      intro: content.intro?.map(interpolateBlock),
      sections: content.sections.map((s) => ({
        heading: interpolateCompanyInfo(s.heading),
        blocks: s.blocks.map(interpolateBlock),
      })),
      closing: content.closing?.map(interpolateBlock),
    },
  };
}

// The language of the supplied source documents. A draft preview falls back
// to it when there is no text in the requested language.
export const LEGAL_SOURCE_LOCALE: Locale = 'bg';

// Unreviewed translations, used ONLY by the draft preview below. They are
// deliberately kept out of the registry (documents.ts keeps `en: null`), so
// they never count towards activation and are never published.
export const LEGAL_DRAFT_TRANSLATIONS: Record<LegalDocumentId, Partial<Record<Locale, LegalDocumentContent>>> = {
  terms: { en: TERMS_EN },
  privacy: { en: PRIVACY_EN },
  cookies: { en: COOKIES_EN },
};

export interface LegalDraftPreview {
  content: LegalDocumentContent;
  // The language actually shown.
  locale: Locale;
  // True when the requested language has no text, so the source is shown.
  isFallback: boolean;
}

// The unpublished text of a document in the visitor's language, for
// reviewing it locally before approval: the registry text, else a draft
// translation, else the source text (flagged as a fallback). Null outside
// `next dev` (config.ts), for an active document (its published version is
// shown instead), and when there is no text at all. Reading it changes
// nothing about activation: the document stays a draft, unpublished and
// unenforced.
export function getLegalDraftPreview(id: LegalDocumentId, locale: Locale): LegalDraftPreview | null {
  if (!isLegalDraftPreviewAllowed() || isLegalDocumentActive(id)) return null;
  const registry = LEGAL_DOCUMENTS[id].content;
  const requested = registry[locale] ?? LEGAL_DRAFT_TRANSLATIONS[id][locale] ?? null;
  if (requested) return { content: requested, locale, isFallback: false };
  const source = registry[LEGAL_SOURCE_LOCALE];
  return source ? { content: source, locale: LEGAL_SOURCE_LOCALE, isFallback: true } : null;
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
