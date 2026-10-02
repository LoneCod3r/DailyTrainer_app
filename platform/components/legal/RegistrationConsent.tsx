'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useT } from '@/lib/i18n/LocaleProvider';
import { useLegal } from './LegalProvider';

export type RegistrationConsentValue = { termsAccepted: boolean; privacyAcknowledged: boolean };

export const EMPTY_REGISTRATION_CONSENT: RegistrationConsentValue = { termsAccepted: false, privacyAcknowledged: false };

// Splits a translated template on "{link}", so the link sits inside the
// sentence in whatever position each language needs.
function withLink(template: string, link: ReactNode): ReactNode {
  const [before, after] = template.split('{link}');
  return (
    <>
      {before}
      {link}
      {after}
    </>
  );
}

// Terms/Privacy fields for the registration form. They render ONLY for
// documents that are active (see modules/legal). While the documents are
// unpublished this renders nothing and registration is unchanged. Links open
// in a new tab, so reading a document doesn't discard the half-filled form.
// The Terms checkbox starts unchecked.
export function RegistrationConsent({
  value,
  onChange,
  invalid,
}: {
  value: RegistrationConsentValue;
  onChange: (value: RegistrationConsentValue) => void;
  invalid?: { terms?: boolean; privacy?: boolean };
}) {
  const t = useT();
  const { config } = useLegal();
  const { termsRequired, privacyRequired, privacyMode } = config.registration;

  if (!termsRequired && !privacyRequired) return null;

  const docLink = (path: string, label: string) => (
    <Link href={path} target="_blank" rel="noopener" className="font-medium text-link underline underline-offset-2">
      {label}
    </Link>
  );
  // The checkbox sentences need their own link wording (Bulgarian uses the
  // definite form there); the privacy notice reads correctly with the title.
  const termsLink = docLink(config.documents.terms.path, t('auth.legalTermsLinkLabel'));
  const privacyLink = docLink(config.documents.privacy.path, t('auth.legalPrivacyLinkLabel'));
  const privacyNoticeLink = docLink(config.documents.privacy.path, t('legal.privacy'));

  return (
    <div className="flex flex-col gap-3 text-sm text-ink-700" data-testid="registration-consent">
      {termsRequired && (
        <div className="flex items-start gap-2">
          <input
            id="accept-terms"
            name="acceptTerms"
            type="checkbox"
            checked={value.termsAccepted}
            onChange={(e) => onChange({ ...value, termsAccepted: e.target.checked })}
            aria-required="true"
            aria-invalid={invalid?.terms || undefined}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
          />
          <label htmlFor="accept-terms">{withLink(t('auth.legalTermsCheckbox'), termsLink)}</label>
        </div>
      )}
      {privacyRequired &&
        (privacyMode === 'checkbox' ? (
          <div className="flex items-start gap-2">
            <input
              id="acknowledge-privacy"
              name="acknowledgePrivacy"
              type="checkbox"
              checked={value.privacyAcknowledged}
              onChange={(e) => onChange({ ...value, privacyAcknowledged: e.target.checked })}
              aria-required="true"
              aria-invalid={invalid?.privacy || undefined}
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            />
            <label htmlFor="acknowledge-privacy">{withLink(t('auth.legalPrivacyCheckbox'), privacyLink)}</label>
          </div>
        ) : (
          <p>{withLink(t('auth.legalPrivacyNotice'), privacyNoticeLink)}</p>
        ))}
    </div>
  );
}
