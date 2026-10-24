import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LEGAL_DOCUMENTS } from '@/modules/legal/documents';
import { COMPANY_INFO } from '@/modules/legal/company';
import { getStorageInventory } from '@/modules/legal/storage-inventory';
import {
  getActiveLegalDocument,
  getLegalDocumentState,
  getLegalDraftPreview,
  getPublicLegalConfig,
  isLegalDocumentActive,
  resolveRegistrationAgreements,
  validateLegalDocument,
} from '@/modules/legal/legal.service';
import {
  LEGAL_DOCUMENT_IDS,
  LEGAL_DOCUMENT_PATHS,
  type LegalDocument,
  type LegalDocumentContent,
  type LegalDocumentId,
} from '@/modules/legal/types';

// Test fixture only: obviously-fake structure used to exercise the
// activation path. It is NOT legal wording and never ships.
const FIXTURE_CONTENT = {
  intro: [{ type: 'paragraph' as const, text: 'Operated by {legalEntityName}.' }],
  sections: [{ heading: 'Fixture section', blocks: [{ type: 'list' as const, items: ['Contact: {contactEmail}'] }] }],
};

const original = structuredClone(LEGAL_DOCUMENTS);
const originalCompany = { ...COMPANY_INFO };

// The published texts hold no bracketed field. Any new one would block
// activation.
const PENDING_FIELDS: Record<LegalDocumentId, { bg: string[]; en: string[] }> = {
  terms: { bg: [], en: [] },
  privacy: { bg: [], en: [] },
  cookies: { bg: [], en: [] },
};

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

describe('legal document registry (current, published state)', () => {
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

  it('ships every document as published version 1.0, effective 24.10.2026, with its Bulgarian text and its English version', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(LEGAL_DOCUMENTS[id].status).toBe('published');
      expect(LEGAL_DOCUMENTS[id].version).toBe('1.0');
      expect(LEGAL_DOCUMENTS[id].effectiveDate).toBe('2026-10-24');
      expect(LEGAL_DOCUMENTS[id].content.bg).not.toBeNull();
      expect(LEGAL_DOCUMENTS[id].content.en).not.toBeNull();
    }
  });

  it('holds each document with its own title and all its numbered headings, in order', () => {
    const headings = (id: LegalDocumentId) => LEGAL_DOCUMENTS[id].content.bg!.sections.map((s) => s.heading);
    expect(LEGAL_DOCUMENTS.terms.content.bg!.title).toBe('ОБЩИ УСЛОВИЯ ЗА ИЗПОЛЗВАНЕ НА KUKO WAY');
    expect(LEGAL_DOCUMENTS.privacy.content.bg!.title).toBe('ПОЛИТИКА ЗА ПОВЕРИТЕЛНОСТ НА KUKO WAY');
    expect(LEGAL_DOCUMENTS.cookies.content.bg!.title).toBe('ПОЛИТИКА ЗА БИСКВИТКИТЕ И ЛОКАЛНОТО СЪХРАНЕНИЕ НА KUKO WAY');
    expect(headings('terms')).toEqual([
      '1. Доставчик',
      '2. Предмет и приемане',
      '3. Профил',
      '4. Здраве и безопасност',
      '5. Общност',
      '6. Плащания',
      '7. Интелектуална собственост',
      '8. Промени и прекратяване',
      '9. Лични данни и бисквитки',
      '10. Жалби, приложимо право и език',
    ]);
    expect(headings('privacy')).toEqual([
      '1. Администратор',
      '2. Какви данни обработваме',
      '3. Цели и правни основания',
      '4. Проверки и лични бележки',
      '5. Видимост в общността',
      '6. Бисквитки и локално съхранение',
      '7. Получатели',
      '8. Предаване извън ЕИП',
      '9. Срокове на съхранение',
      '10. Вашите права',
      '11. Непълнолетни',
      '12. Сигурност',
      '13. Автоматизирани решения',
      '14. Промени',
    ]);
    expect(headings('cookies')).toEqual([
      '1. Какво са бисквитките',
      '2. Кой ги използва',
      '3. Какво използваме',
      '4. Външни услуги',
      '5. Как управлявате избора си',
      '6. Промени',
    ]);
  });

  it('holds public text only, in both languages: no draft info line, team notes, draft wording, or bracketed fields other than the pending ones', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      for (const locale of ['bg', 'en'] as const) {
        const content = LEGAL_DOCUMENTS[id].content[locale]!;
        expect(content.info, id).toBeUndefined();
        expect(content.intro, id).toBeUndefined();
        expect(content.closing, id).toBeUndefined();
        expect(content.sections.flatMap((s) => s.blocks).some((b) => b.internal), id).toBe(false);
        const text = JSON.stringify(content);
        // Every string value, without the JSON structure (whose arrays use brackets too).
        const strings: string[] = [];
        JSON.stringify(content, (_key, value) => (typeof value === 'string' && strings.push(value), value));
        expect(strings.flatMap((s) => s.match(/\[[^\]]*\]/g) ?? []), `${id} ${locale}`).toEqual(PENDING_FIELDS[id][locale]);
        expect(text, id).not.toMatch(
          /не за публикуване|not for publication|проект|draft|за екипа|for the team|публичния преглед|public review|TODO|потвърдете дали|confirm whether/i,
        );
        // No company token is left: the contact email was removed from the
        // texts (client decision, 24.10.2026).
        expect([...new Set(text.match(/\{\w+\}/g))], id).toEqual([]);
      }
    }
  });

  it('links only to the site’s own routes (relative, so they survive the domain move) and to Google’s policies', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      for (const content of [LEGAL_DOCUMENTS[id].content.bg!, LEGAL_DOCUMENTS[id].content.en!]) {
        const text = JSON.stringify(content);
        const hrefs = [...text.matchAll(/"href":"([^"]+)"/g)].map((m) => m[1]);
        for (const href of hrefs) {
          expect(['/privacy', '/cookies', 'https://policies.google.com/privacy', 'https://policies.google.com/terms']).toContain(href);
        }
        expect(text).not.toMatch(/vercel\.app|kukoway\.com/);
      }
    }
  });

  it('keeps the Cookie Policy without the detailed list and the necessary/optional section (removed at the owner’s request)', () => {
    const text = JSON.stringify(LEGAL_DOCUMENTS.cookies.content.bg);
    expect(text).not.toMatch(/Подробен списък|Необходими и незадължителни технологии/);
    for (const name of getStorageInventory({ recaptchaCategory: 'necessary' }).flatMap((item) => item.names)) {
      expect(text, name).not.toContain(`"${name}"`);
    }
  });

  it('activates every current text in both languages once the master switch is on, and not before', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(validateLegalDocument(LEGAL_DOCUMENTS[id])).toEqual([]);
      expect(isLegalDocumentActive(id)).toBe(false);
      expect(getActiveLegalDocument(id, 'bg')).toBeNull();
    }
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(isLegalDocumentActive(id)).toBe(true);
      expect(getActiveLegalDocument(id, 'bg')?.content.title).toBe(LEGAL_DOCUMENTS[id].content.bg!.title);
      expect(getActiveLegalDocument(id, 'en')?.content.title).toBe(LEGAL_DOCUMENTS[id].content.en!.title);
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
    for (const id of LEGAL_DOCUMENT_IDS) LEGAL_DOCUMENTS[id].status = 'draft';
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

  it('validates and fills placeholders in every part of rich content (title, info, runs, quotes, closing)', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    publish(LEGAL_DOCUMENTS.terms);
    const rich: LegalDocumentContent = {
      title: 'Terms of {legalEntityName}',
      info: [{ text: 'Version:', strong: true }, ' 1.0', { lineBreak: true }, 'Site'],
      intro: [{ type: 'blockquote', text: [{ text: 'Note:', strong: true }, ' by {legalEntityName}'] }],
      sections: [
        {
          heading: '1. Fixture',
          blocks: [
            {
              type: 'paragraph',
              text: ['See ', { text: 'the policy', href: 'https://example.dev/privacy' }, ' and ', { text: 'ptd_locale', code: true }],
            },
            { type: 'list', items: [[{ text: 'Mail:', strong: true }, ' {contactEmail}']] },
          ],
        },
      ],
      closing: [{ type: 'paragraph', text: [{ text: 'End', strong: true }, ' {contactEmail}'] }],
    };
    LEGAL_DOCUMENTS.terms.content = { bg: structuredClone(rich), en: structuredClone(rich) };
    expect(validateLegalDocument(LEGAL_DOCUMENTS.terms)).toEqual(
      expect.arrayContaining(['bg: company value "legalEntityName" is not set (company.ts)']),
    );

    fillCompany();
    expect(validateLegalDocument(LEGAL_DOCUMENTS.terms)).toEqual([]);
    const doc = getActiveLegalDocument('terms', 'en')!;
    expect(doc.content.title).toBe('Terms of Fixture Ltd');
    // The draft info line is never part of the published document.
    expect(doc.content.info).toBeUndefined();
    expect(doc.content.intro).toEqual([{ type: 'blockquote', text: [{ text: 'Note:', strong: true }, ' by Fixture Ltd'] }]);
    expect(doc.content.sections[0].blocks).toEqual([
      rich.sections[0].blocks[0],
      { type: 'list', items: [[{ text: 'Mail:', strong: true }, ' legal@example.dev']] },
    ]);
    expect(doc.content.closing).toEqual([{ type: 'paragraph', text: [{ text: 'End', strong: true }, ' legal@example.dev'] }]);
  });

  it('checks only the public text: internal notes and the draft info line are ignored, public placeholders are not', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    publish(LEGAL_DOCUMENTS.cookies);
    fillCompany();
    const content: LegalDocumentContent = {
      info: 'Status: [draft only]',
      intro: [{ type: 'blockquote', internal: true, text: 'Fields [●] must be filled' }],
      sections: [{ heading: '1. Fixture', blocks: [{ type: 'paragraph', text: 'Public text.' }] }],
      closing: [{ type: 'paragraph', internal: true, text: 'Check [before publication]' }],
    };
    LEGAL_DOCUMENTS.cookies.content = { bg: structuredClone(content), en: structuredClone(content) };
    expect(validateLegalDocument(LEGAL_DOCUMENTS.cookies)).toEqual([]);
    const published = getActiveLegalDocument('cookies', 'bg')!;
    expect(published.content).toEqual({
      title: undefined,
      intro: undefined,
      sections: [{ heading: '1. Fixture', blocks: [{ type: 'paragraph', text: 'Public text.' }] }],
      closing: undefined,
    });

    // The same placeholder in public text still blocks activation.
    LEGAL_DOCUMENTS.cookies.content.bg!.sections[0].blocks.push({ type: 'paragraph', text: 'Contact [●]' });
    expect(validateLegalDocument(LEGAL_DOCUMENTS.cookies)).toEqual(['bg: unresolved field [●]']);
    expect(isLegalDocumentActive('cookies')).toBe(false);
  });

  it('stays inactive while any bracketed field is unresolved, wherever it appears', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    publish(LEGAL_DOCUMENTS.cookies);
    fillCompany();
    LEGAL_DOCUMENTS.cookies.content.bg!.closing = [{ type: 'paragraph', text: [{ text: '[имейл]', strong: true }] }];
    expect(validateLegalDocument(LEGAL_DOCUMENTS.cookies)).toEqual(['bg: unresolved field [имейл]']);
    expect(isLegalDocumentActive('cookies')).toBe(false);
  });
});

describe('draft preview (local development only)', () => {
  it('returns the draft in the requested language only when NODE_ENV is "development"', () => {
    vi.stubEnv('NODE_ENV', 'development');
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(getLegalDraftPreview(id, 'bg')).toEqual({ content: LEGAL_DOCUMENTS[id].content.bg, locale: 'bg', isFallback: false });
      expect(getLegalDraftPreview(id, 'en')).toEqual({ content: LEGAL_DOCUMENTS[id].content.en, locale: 'en', isFallback: false });
    }

    for (const env of ['production', 'test', '', 'Development', 'dev']) {
      vi.stubEnv('NODE_ENV', env);
      for (const id of LEGAL_DOCUMENT_IDS) {
        expect(getLegalDraftPreview(id, 'bg')).toBeNull();
        expect(getLegalDraftPreview(id, 'en')).toBeNull();
      }
    }
  });

  it('falls back to the Bulgarian source, flagged as such, when a translation is missing', () => {
    vi.stubEnv('NODE_ENV', 'development');
    LEGAL_DOCUMENTS.privacy.content.en = null;
    expect(getLegalDraftPreview('privacy', 'en')).toEqual({ content: LEGAL_DOCUMENTS.privacy.content.bg, locale: 'bg', isFallback: true });
  });

  it('never turns on in production, whatever the legal switches say', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(getLegalDraftPreview(id, 'bg')).toBeNull();
      expect(getLegalDraftPreview(id, 'en')).toBeNull();
    }
  });

  it('does not activate, publish or enforce anything: drafts stay blocked by their status', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const id of LEGAL_DOCUMENT_IDS) LEGAL_DOCUMENTS[id].status = 'draft';
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(getLegalDraftPreview(id, 'bg')).not.toBeNull();
      expect(getLegalDraftPreview(id, 'en')).not.toBeNull();
      expect(isLegalDocumentActive(id)).toBe(false);
      expect(getActiveLegalDocument(id, 'en')).toBeNull();
      expect(getActiveLegalDocument(id, 'bg')).toBeNull();
      expect(validateLegalDocument(LEGAL_DOCUMENTS[id])).toEqual(
        expect.arrayContaining(['status is not "published"']),
      );
    }
    expect(getPublicLegalConfig().registration).toMatchObject({ termsRequired: false, privacyRequired: false });
    expect(resolveRegistrationAgreements(undefined, 'bg')).toEqual([]);
  });

  it('gives way to the published version once a document is active', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    publish(LEGAL_DOCUMENTS.terms);
    fillCompany();
    expect(isLegalDocumentActive('terms')).toBe(true);
    expect(getLegalDraftPreview('terms', 'bg')).toBeNull();
    expect(getLegalDraftPreview('terms', 'en')).toBeNull();
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
