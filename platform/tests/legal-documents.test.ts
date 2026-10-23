import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LEGAL_DOCUMENTS } from '@/modules/legal/documents';
import { COMPANY_INFO } from '@/modules/legal/company';
import { getStorageInventory } from '@/modules/legal/storage-inventory';
import {
  getActiveLegalDocument,
  getLegalDocumentState,
  getLegalDraftPreview,
  LEGAL_DRAFT_TRANSLATIONS,
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

  it('ships every document as an unapproved draft with Bulgarian text only (no translation invented)', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(LEGAL_DOCUMENTS[id].status).toBe('draft');
      expect(LEGAL_DOCUMENTS[id].version).toBe('0.1-draft');
      expect(LEGAL_DOCUMENTS[id].effectiveDate).toBeNull();
      expect(LEGAL_DOCUMENTS[id].content.bg).not.toBeNull();
      expect(LEGAL_DOCUMENTS[id].content.en).toBeNull();
    }
  });

  it('holds each source document with its own title and all its numbered headings, in order', () => {
    const headings = (id: LegalDocumentId) => LEGAL_DOCUMENTS[id].content.bg!.sections.map((s) => s.heading);
    expect(LEGAL_DOCUMENTS.terms.content.bg!.title).toBe('ОБЩИ УСЛОВИЯ ЗА ИЗПОЛЗВАНЕ НА KUKO WAY');
    expect(LEGAL_DOCUMENTS.privacy.content.bg!.title).toBe('ПОЛИТИКА ЗА ПОВЕРИТЕЛНОСТ НА KUKO WAY');
    expect(LEGAL_DOCUMENTS.cookies.content.bg!.title).toBe('ПОЛИТИКА ЗА БИСКВИТКИТЕ И ЛОКАЛНОТО СЪХРАНЕНИЕ НА KUKO WAY');
    expect(headings('terms')).toEqual([
      '1. Кой предоставя KUKO WAY',
      '2. Обхват и приемане',
      '3. Какво включва платформата',
      '4. Профили и допустимост',
      '5. Здраве, лична отговорност и граници на практиките',
      '6. Общност, дискусии и срещи',
      '7. Поръчки и плащания — при активиране на продажбите',
      '8. Право на отказ, възстановяване и законови права',
      '9. Доброволна подкрепа',
      '10. Интелектуална собственост',
      '11. Наличност, промени и прекратяване',
      '12. Защита на данни и бисквитки',
      '13. Жалби, спорове и приложимо право',
      '14. Контакти и дата',
    ]);
    expect(headings('privacy')).toEqual([
      '1. Кой отговаря за личните данни',
      '2. Какви данни може да обработваме',
      '3. Специални категории данни – информация за здравето',
      '4. За какви цели и на какво основание',
      '5. Публична общност и видимост',
      '6. Бисквитки и локално съхранение',
      '7. Получатели и доставчици',
      '8. Предаване извън Европейското икономическо пространство',
      '9. Колко дълго съхраняваме данните',
      '10. Права на потребителя',
      '11. Деца и непълнолетни',
      '12. Сигурност и инциденти',
      '13. Автоматизация и индивидуални препоръки',
      '14. Промени и контакт',
    ]);
    expect(headings('cookies')).toEqual([
      '1. Какво представляват бисквитките',
      '2. Кой използва тези технологии',
      '3. За какво ги използваме',
      '4. Как управлявате избора си',
      '5. Бисквитки от трети лица и вградено съдържание',
      '6. Актуализации и контакт',
    ]);
  });

  it('keeps the source notes for the team and the closing notes after the rule (nothing silently dropped)', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      const bg = LEGAL_DOCUMENTS[id].content.bg!;
      expect(bg.intro?.[0].type).toBe('blockquote');
      expect(JSON.stringify(bg.intro)).toMatch(/не за публикуване:/);
      expect(bg.closing).toHaveLength(1);
      expect(JSON.stringify(bg.info)).toMatch(/проект 1\.0/);
    }
  });

  it('keeps the Cookie Policy without the detailed list and the necessary/optional section (removed at the owner’s request)', () => {
    const text = JSON.stringify(LEGAL_DOCUMENTS.cookies.content.bg);
    expect(text).not.toMatch(/Подробен списък|Необходими и незадължителни технологии/);
    for (const name of getStorageInventory({ recaptchaCategory: 'necessary' }).flatMap((item) => item.names)) {
      expect(text, name).not.toContain(`"${name}"`);
    }
  });

  it('can never activate the supplied drafts: their unresolved [...] fields block them even if everything else were set', () => {
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    fillCompany();
    for (const id of LEGAL_DOCUMENT_IDS) {
      const doc = LEGAL_DOCUMENTS[id];
      doc.status = 'published';
      doc.effectiveDate = '2026-11-01';
      doc.content.en = structuredClone(doc.content.bg);
      expect(validateLegalDocument(doc)).toEqual(expect.arrayContaining(['bg: unresolved field [●]']));
      expect(isLegalDocumentActive(id)).toBe(false);
      expect(getActiveLegalDocument(id, 'bg')).toBeNull();
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
    expect(doc.content.info).toEqual(rich.info);
    expect(doc.content.intro).toEqual([{ type: 'blockquote', text: [{ text: 'Note:', strong: true }, ' by Fixture Ltd'] }]);
    expect(doc.content.sections[0].blocks).toEqual([
      rich.sections[0].blocks[0],
      { type: 'list', items: [[{ text: 'Mail:', strong: true }, ' legal@example.dev']] },
    ]);
    expect(doc.content.closing).toEqual([{ type: 'paragraph', text: [{ text: 'End', strong: true }, ' legal@example.dev'] }]);
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
      expect(getLegalDraftPreview(id, 'en')).toEqual({ content: LEGAL_DRAFT_TRANSLATIONS[id].en, locale: 'en', isFallback: false });
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
    const saved = LEGAL_DRAFT_TRANSLATIONS.privacy.en;
    delete LEGAL_DRAFT_TRANSLATIONS.privacy.en;
    try {
      expect(getLegalDraftPreview('privacy', 'en')).toEqual({ content: LEGAL_DOCUMENTS.privacy.content.bg, locale: 'bg', isFallback: true });
    } finally {
      LEGAL_DRAFT_TRANSLATIONS.privacy.en = saved;
    }
  });

  it('keeps the translations out of the registry, so they never count towards publication', () => {
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(LEGAL_DOCUMENTS[id].content.en).toBeNull();
      expect(LEGAL_DRAFT_TRANSLATIONS[id].en).toBeTruthy();
    }
  });

  it('never turns on in production, whatever the legal switches say', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(getLegalDraftPreview(id, 'bg')).toBeNull();
      expect(getLegalDraftPreview(id, 'en')).toBeNull();
    }
  });

  it('does not activate, publish or enforce anything: the drafts stay blocked by missing EN text and unresolved fields', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('LEGAL_DOCUMENTS_PUBLISHED', 'true');
    for (const id of LEGAL_DOCUMENT_IDS) {
      expect(getLegalDraftPreview(id, 'bg')).not.toBeNull();
      expect(getLegalDraftPreview(id, 'en')).not.toBeNull();
      expect(isLegalDocumentActive(id)).toBe(false);
      expect(getActiveLegalDocument(id, 'en')).toBeNull();
      expect(getActiveLegalDocument(id, 'bg')).toBeNull();
      expect(LEGAL_DOCUMENTS[id]).toMatchObject({ status: 'draft', version: '0.1-draft', effectiveDate: null });
      expect(validateLegalDocument(LEGAL_DOCUMENTS[id])).toEqual(
        expect.arrayContaining(['status is not "published"', 'no approved en content', 'bg: unresolved field [●]']),
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
