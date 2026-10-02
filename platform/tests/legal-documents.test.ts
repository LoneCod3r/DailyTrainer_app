import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LEGAL_DOCUMENTS } from '@/modules/legal/documents';
import { COMPANY_INFO } from '@/modules/legal/company';
import {
  getActiveLegalDocument,
  getLegalDocumentState,
  getPublicLegalConfig,
  isLegalDocumentActive,
  resolveRegistrationAgreements,
  validateLegalDocument,
} from '@/modules/legal/legal.service';
import { LEGAL_DOCUMENT_IDS, LEGAL_DOCUMENT_PATHS, type LegalDocument } from '@/modules/legal/types';

// Test fixture only: obviously-fake structure used to exercise the
// activation path. It is NOT legal wording and never ships.
const FIXTURE_CONTENT = {
  intro: [{ type: 'paragraph' as const, text: 'Operated by {legalEntityName}.' }],
  sections: [{ heading: 'Fixture section', blocks: [{ type: 'list' as const, items: ['Contact: {contactEmail}'] }] }],
};

const original = structuredClone(LEGAL_DOCUMENTS);
const originalCompany = { ...COMPANY_INFO };

function publish(doc: LegalDocument, version = '1.0') {
  doc.status = 'published';
  doc.version = version;
  doc.effectiveDate = '2026-11-01';
  doc.content = { bg: structuredClone(FIXTURE_CONTENT), en: structuredClone(FIXTURE_CONTENT) };
}

function fillCompany() {
  COMPANY_INFO.legalEntityName = 'Fixture Ltd';
  COMPANY_INFO.contactEmail = 'legal@example.dev';
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  for (const id of LEGAL_DOCUMENT_IDS) LEGAL_DOCUMENTS[id] = structuredClone(original[id]);
  Object.assign(COMPANY_INFO, originalCompany);
  vi.unstubAllEnvs();
});

describe('legal document registry (current, unapproved state)', () => {
  it('defines exactly Terms, Privacy and Cookies, each with id/version/status/effectiveDate/bg+en content', () => {
    expect(Object.keys(LEGAL_DOCUMENTS).sort()).toEqual(['cookies', 'privacy', 'terms']);
    for (const id of LEGAL_DOCUMENT_IDS) {
      const doc = LEGAL_DOCUMENTS[id];
      expect(doc.id).toBe(id);
      expect(doc.version).toBeTruthy();
      expect(['draft', 'published']).toContain(doc.status);
      expect(doc).toHaveProperty('effectiveDate');
      expect(doc.content).toHaveProperty('bg');
      expect(doc.content).toHaveProperty('en');
    }
  });

  it('ships every document as an unapproved draft with no content (nothing invented)', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(LEGAL_DOCUMENTS[id].status).toBe('draft');
      expect(LEGAL_DOCUMENTS[id].effectiveDate).toBeNull();
      expect(LEGAL_DOCUMENTS[id].content).toEqual({ bg: null, en: null });
    }
  });

  it('ships every company detail unset (no invented operator info)', () => {
    expect(Object.values(COMPANY_INFO).every((v) => v === null)).toBe(true);
  });

  it('maps documents to /terms, /privacy and /cookies', () => {
    expect(LEGAL_DOCUMENT_PATHS).toEqual({ terms: '/terms', privacy: '/privacy', cookies: '/cookies' });
  });
});

describe('activation rules', () => {
  it('nothing is active while LEGAL_DOCUMENTS_PUBLISHED is unset, even a fully published document', () => {
    publish(LEGAL_DOCUMENTS.terms);
    fillCompany();
    expect(isLegalDocumentActive('terms')).toBe(false);
    expect(getActiveLegalDocument('terms', 'en')).toBeNull();
  });

  it('a draft never becomes active, even with the master switch on', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const id of LEGAL_DOCUMENT_IDS) expect(isLegalDocumentActive(id)).toBe(false);
  });

  it('only "true" turns the master switch on', () => {
    publish(LEGAL_DOCUMENTS.terms);
    fillCompany();
    for (const v of ['1', 'yes', 'TRUE', '']) {
      vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', v);
      expect(isLegalDocumentActive('terms')).toBe(false);
    }
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    expect(isLegalDocumentActive('terms')).toBe(true);
  });

  it('activates a published document with both languages, an effective date and its company values', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    publish(LEGAL_DOCUMENTS.privacy, '2.1');
    fillCompany();
    expect(validateLegalDocument(LEGAL_DOCUMENTS.privacy)).toEqual([]);
    expect(getLegalDocumentState('privacy')).toEqual({
      id: 'privacy',
      version: '2.1',
      active: true,
      effectiveDate: '2026-11-01',
      path: '/privacy',
    });
  });

  it('stays inactive when one language is missing (BG and EN must ship together)', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    publish(LEGAL_DOCUMENTS.terms);
    fillCompany();
    LEGAL_DOCUMENTS.terms.content.bg = null;
    expect(validateLegalDocument(LEGAL_DOCUMENTS.terms)).toContain('no approved bg content');
    expect(isLegalDocumentActive('terms')).toBe(false);
  });

  it('stays inactive without an effective date', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    publish(LEGAL_DOCUMENTS.terms);
    fillCompany();
    LEGAL_DOCUMENTS.terms.effectiveDate = null;
    expect(isLegalDocumentActive('terms')).toBe(false);
  });

  it('stays inactive while a referenced company value is still unset, and flags unknown placeholders', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    publish(LEGAL_DOCUMENTS.cookies);
    expect(validateLegalDocument(LEGAL_DOCUMENTS.cookies)).toEqual(
      expect.arrayContaining([expect.stringContaining('"legalEntityName" is not set')]),
    );
    expect(isLegalDocumentActive('cookies')).toBe(false);

    fillCompany();
    LEGAL_DOCUMENTS.cookies.content.en!.sections[0].heading = 'Typo {legalEntityNmae}';
    expect(validateLegalDocument(LEGAL_DOCUMENTS.cookies)).toContain('en: unknown placeholder {legalEntityNmae}');
  });

  it('fills company values into the rendered content of an active document', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    publish(LEGAL_DOCUMENTS.terms);
    fillCompany();
    const doc = getActiveLegalDocument('terms', 'bg')!;
    expect(doc.content.intro).toEqual([{ type: 'paragraph', text: 'Operated by Fixture Ltd.' }]);
    expect(doc.content.sections[0].blocks[0]).toEqual({ type: 'list', items: ['Contact: legal@example.dev'] });
  });
});

describe('public (client) legal config', () => {
  it('requires nothing at registration in the current state, and uses safe defaults', () => {
    const config = getPublicLegalConfig();
    expect(config.registration).toEqual({
      termsRequired: false,
      termsVersion: null,
      privacyRequired: false,
      privacyVersion: null,
      privacyMode: 'notice',
    });
    expect(config.recaptchaCategory).toBe('necessary');
    expect(config.cookiePolicyVersion).toBe(LEGAL_DOCUMENTS.cookies.version);
    expect(Object.values(config.documents).every((d) => !d.active)).toBe(true);
  });

  it('exposes active versions once published, and honors the privacy/reCAPTCHA settings', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    vi.stubEnv('LEGAL_PRIVACY_ACKNOWLEDGEMENT', 'checkbox');
    vi.stubEnv('RECAPTCHA_CONSENT_CATEGORY', 'preferences');
    publish(LEGAL_DOCUMENTS.terms, '1.0');
    publish(LEGAL_DOCUMENTS.privacy, '1.2');
    fillCompany();
    const { registration, recaptchaCategory } = getPublicLegalConfig();
    expect(registration).toEqual({
      termsRequired: true,
      termsVersion: '1.0',
      privacyRequired: true,
      privacyVersion: '1.2',
      privacyMode: 'checkbox',
    });
    expect(recaptchaCategory).toBe('preferences');
  });

  it('ignores an unknown reCAPTCHA category instead of guessing', () => {
    vi.stubEnv('RECAPTCHA_CONSENT_CATEGORY', 'security');
    expect(getPublicLegalConfig().recaptchaCategory).toBe('necessary');
  });
});

describe('resolveRegistrationAgreements', () => {
  const NOW = new Date('2026-11-05T10:00:00.000Z');

  it('records nothing and requires nothing while documents are unpublished', () => {
    expect(resolveRegistrationAgreements(undefined, 'en', NOW)).toEqual([]);
    // Even an explicit "accepted" for a draft is not recorded.
    expect(
      resolveRegistrationAgreements({ termsAccepted: true, termsVersion: '0.1-draft' }, 'en', NOW),
    ).toEqual([]);
  });

  describe('with Terms and Privacy active', () => {
    beforeEach(() => {
      vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
      publish(LEGAL_DOCUMENTS.terms, '1.0');
      publish(LEGAL_DOCUMENTS.privacy, '1.2');
      fillCompany();
    });

    it('rejects a registration without Terms acceptance', () => {
      expect(() => resolveRegistrationAgreements(undefined, 'en', NOW)).toThrow(/accept the Terms/);
      expect(() =>
        resolveRegistrationAgreements({ termsAccepted: false, termsVersion: '1.0', privacyVersion: '1.2' }, 'en', NOW),
      ).toThrow(/accept the Terms/);
    });

    it('rejects acceptance of an outdated Terms or Privacy version', () => {
      expect(() =>
        resolveRegistrationAgreements({ termsAccepted: true, termsVersion: '0.9', privacyVersion: '1.2' }, 'en', NOW),
      ).toThrow(/Terms & Conditions have been updated/);
      expect(() =>
        resolveRegistrationAgreements({ termsAccepted: true, termsVersion: '1.0', privacyVersion: '1.1' }, 'en', NOW),
      ).toThrow(/Privacy Policy has been updated/);
    });

    it('returns one record per document with version, action, locale and a shared timestamp', () => {
      const records = resolveRegistrationAgreements(
        { termsAccepted: true, termsVersion: '1.0', privacyVersion: '1.2' },
        'bg',
        NOW,
      );
      expect(records).toEqual([
        { documentType: 'TERMS', documentVersion: '1.0', action: 'ACCEPTED', locale: 'bg', source: 'REGISTRATION', acceptedAt: NOW },
        { documentType: 'PRIVACY', documentVersion: '1.2', action: 'ACKNOWLEDGED', locale: 'bg', source: 'REGISTRATION', acceptedAt: NOW },
      ]);
    });

    it('requires the privacy checkbox only in "checkbox" mode', () => {
      vi.stubEnv('LEGAL_PRIVACY_ACKNOWLEDGEMENT', 'checkbox');
      expect(() =>
        resolveRegistrationAgreements({ termsAccepted: true, termsVersion: '1.0', privacyVersion: '1.2' }, 'en', NOW),
      ).toThrow(/read the Privacy Policy/);
      expect(
        resolveRegistrationAgreements(
          { termsAccepted: true, termsVersion: '1.0', privacyAcknowledged: true, privacyVersion: '1.2' },
          'en',
          NOW,
        ),
      ).toHaveLength(2);
    });
  });
});
