import { z } from 'zod';

// The one password rule for every place a password is chosen (registration,
// reset, change). 72 is bcrypt's input limit: longer input would be silently
// truncated when hashed.
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters');

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

// `website` is a honeypot: a field real users never see or fill (hidden off
// -screen in the form, see components/auth/HoneypotField.tsx) but a naive
// bot filling every input will. `formRenderedAt` is the client-reported epoch
// ms when the form mounted — combined with a minimum-elapsed-time check on
// the server (see modules/auth/auth.service.ts), it filters submissions that
// happen implausibly fast for a human filling three fields. Neither is a
// security boundary on its own (both are client-reported) — they're cheap
// friction layered under the server-verified CAPTCHA, which is the real
// boundary (see lib/recaptcha.ts).
export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().toLowerCase(),
  password: passwordSchema,
  captchaToken: z.string().min(1, 'Captcha verification is required'),
  // Deliberately NOT constrained to empty here — a non-empty value is a
  // meaningful signal (an automated client filled it), not a validation
  // failure, and rejecting it at the schema layer would short-circuit
  // before it reaches the honeypot check in modules/auth/auth.service.ts,
  // which is where that decision (and its logging) actually belongs.
  website: z.string().max(500).optional().default(''),
  formRenderedAt: z.number().optional(),
  // Simple arithmetic anti-bot challenge (see lib/math-challenge.ts) — one
  // more layer alongside CAPTCHA/honeypot, not a replacement for either.
  // z.coerce.number() rejects a missing/blank answer as NaN, which zod's
  // number check refuses.
  mathChallengeId: z.string().min(1, 'Security check is required'),
  mathAnswer: z.coerce.number({ invalid_type_error: 'Please answer the security check' }),
  // Terms/Privacy agreement. Optional at the schema level: whether it is
  // required depends on which legal documents are currently active, and
  // modules/legal/legal.service.ts (resolveRegistrationAgreements) enforces
  // that. Versions are the ones the form displayed, checked against the
  // current versions on the server.
  legalConsent: z
    .object({
      termsAccepted: z.boolean().optional(),
      termsVersion: z.string().max(50).optional(),
      privacyAcknowledged: z.boolean().optional(),
      privacyVersion: z.string().max(50).optional(),
    })
    .optional(),
});

export const resendVerificationSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

// Signed-in password change. The refinement messages are stable codes that
// the settings form maps to localized text (components/account/ChangePasswordForm.tsx).
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(200),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: 'PASSWORD_MISMATCH',
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ['newPassword'],
    message: 'SAME_AS_CURRENT',
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
