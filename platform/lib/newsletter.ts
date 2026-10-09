// The single place the footer signup hands an email to a subscription
// service. No newsletter provider or backend is configured in this project
// yet, so this deliberately reports NOT_CONFIGURED instead of pretending the
// signup worked — the form then shows its service error, never a success.
//
// Once a provider is chosen (double opt-in recommended), replace the body
// with a call to the server endpoint that talks to it, and return
// { ok: true } only after that endpoint confirms the request was accepted
// and the confirmation email was triggered.

// False until subscribeToNewsletter talks to a real provider. While false,
// the footer shows the signup as a "coming soon" preview: the form is
// disabled, never submits, and says sign-ups aren't open yet.
export const NEWSLETTER_PROVIDER_CONFIGURED = false;

export type NewsletterSubscribeResult = { ok: true } | { ok: false; reason: 'NOT_CONFIGURED' | 'FAILED' };

export async function subscribeToNewsletter(_email: string): Promise<NewsletterSubscribeResult> {
  return { ok: false, reason: 'NOT_CONFIGURED' };
}
