// Runtime switches for the legal infrastructure. All of them are read from
// the environment on the server at request time, so a deployment can change
// them without code changes. Every default is the safe "not active" state.
import { isCookieCategory, type CookieCategory } from './cookie-consent';

// Master switch. While false (the default), no legal document is presented as
// current or approved, and registration never requires or records an
// agreement, whatever each document's own status is. An individual document
// also needs `status: 'published'` and complete content (documents.ts).
export function isLegalPublishingEnabled(): boolean {
  return process.env.LEGAL_DOCUMENTS_PUBLISHED === 'true';
}

// Google reCAPTCHA (registration bot protection) sets the third-party cookie
// `_GRECAPTCHA` and writes `_grecaptcha` to localStorage. Whether that needs
// prior consent or counts as strictly necessary security is a legal decision,
// so it is a setting here, not something the code assumes:
//   - 'necessary' (default): the current behavior. reCAPTCHA loads on the
//     registration page without asking.
//   - 'preferences' | 'analytics' | 'marketing': reCAPTCHA loads only after the
//     visitor allows that category. The registration form explains why and
//     offers a one-click way to allow it, so registration never dead-ends.
export function getRecaptchaConsentCategory(): CookieCategory {
  const value = process.env.RECAPTCHA_CONSENT_CATEGORY;
  return isCookieCategory(value) ? value : 'necessary';
}

// How registration handles the Privacy Policy once it is active. A privacy
// policy is usually information to acknowledge, not something to "accept",
// but the right presentation is a legal decision:
//   - 'notice' (default): a visible statement with a link. The version shown
//     is still recorded as ACKNOWLEDGED.
//   - 'checkbox': a separate required checkbox, recorded as ACKNOWLEDGED.
export type PrivacyAcknowledgementMode = 'notice' | 'checkbox';

export function getPrivacyAcknowledgementMode(): PrivacyAcknowledgementMode {
  return process.env.LEGAL_PRIVACY_ACKNOWLEDGEMENT === 'checkbox' ? 'checkbox' : 'notice';
}
