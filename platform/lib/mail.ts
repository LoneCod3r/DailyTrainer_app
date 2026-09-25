import nodemailer from 'nodemailer';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { createLogger } from '@/lib/logger';

const log = createLogger('mail');

// Non-production-only capture of the last email sent to each address, as a
// local JSON file — lets Playwright e2e specs read the actual verification
// / reset link a test run generated (there's no real inbox to check against)
// without adding a fake SMTP inbox service to the stack. Never runs in
// production (see sendMail below) and the directory is gitignored.
const OUTBOX_DIR = path.join(process.cwd(), 'tests', '.mail-outbox');

async function captureForTests(input: SendMailInput) {
  if (process.env.NODE_ENV === 'production') return;
  try {
    await mkdir(OUTBOX_DIR, { recursive: true });
    const fileName = `${input.to.replace(/[^a-z0-9@._-]/gi, '_')}.json`;
    await writeFile(
      path.join(OUTBOX_DIR, fileName),
      JSON.stringify({ ...input, sentAt: new Date().toISOString() }, null, 2),
    );
  } catch (err) {
    log.warn('failed to write test mail outbox', { message: (err as Error)?.message });
  }
}

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

// SMTP_HOST/PORT/SECURE/USER/PASSWORD point at any standard SMTP endpoint —
// a production provider (Postmark, SES, Mailgun, Resend's SMTP endpoint,
// ...) or a local-dev sandbox (Mailtrap, Ethereal) are configured exactly
// the same way, through these same five variables. There is no separate
// "sandbox mode": pointing them at a sandbox inbox *is* the supported way
// to test real delivery locally (see docs/auth-security.md) — this file
// never special-cases a provider by name.
function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  return transporter;
}

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

// Thrown by sendMail when a caller must not treat the email as sent:
// SMTP is unconfigured in production, or a configured transporter's send
// genuinely failed (auth error, connection refused, provider rejection,
// ...). Distinguished from a generic Error so callers (see
// modules/auth/auth.service.ts registerUser) can react specifically —
// e.g. roll back a just-created account rather than leave it stranded
// with no way to ever receive its verification link.
export class EmailDeliveryError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'EmailDeliveryError';
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

// Sends via SMTP when SMTP_HOST is configured. With no SMTP_HOST configured
// outside production, logs the email instead (and captures it for the e2e
// suite) so local dev works without a mail provider — but this fallback is
// intentionally unavailable in production: verification/reset emails are
// security-critical, so pretending one was sent when it wasn't is worse
// than failing loudly. See registerUser for how a failure here is handled.
export async function sendMail(input: SendMailInput): Promise<void> {
  const client = getTransporter();

  if (!client) {
    if (process.env.NODE_ENV === 'production') {
      log.error('SMTP_HOST is not configured in production; refusing to silently skip sending', {
        to: input.to,
        subject: input.subject,
      });
      throw new EmailDeliveryError('Email delivery is not configured');
    }
    log.info('SMTP not configured — logging email instead of sending (dev-only fallback)', {
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    await captureForTests(input);
    return;
  }

  try {
    const info = await client.sendMail({
      from: process.env.EMAIL_FROM ?? 'no-reply@example.dev',
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    // Only ever truthy for an Ethereal Email sandbox transport (a Nodemailer
    // built-in, not a special case we add) — a direct link to the captured
    // message, handy while testing locally against it. A no-op elsewhere.
    const previewUrl = nodemailer.getTestMessageUrl(info);
    log.info('email sent', { to: input.to, subject: input.subject, previewUrl: previewUrl || undefined });
    await captureForTests(input);
  } catch (err) {
    // A real, configured provider rejected or failed to deliver the email —
    // never swallow this. The caller decides how to fail; see registerUser
    // (rolls back the account) vs resendVerificationEmail/
    // requestPasswordReset (log and stay enumeration-safe — see there for
    // why those two don't propagate this).
    log.error('failed to send email', { to: input.to, message: (err as Error)?.message });
    throw new EmailDeliveryError('Failed to send email', { cause: err });
  }
}

function baseUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3000';
}

// Escapes a plain-text value for safe use in HTML element content or a
// double/single-quoted attribute. `&` must be replaced first so the entities
// produced by the later replacements aren't themselves re-escaped.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Inline styles only: most email clients strip <style> blocks and external
// stylesheets, so a button that has to render consistently in Gmail/Outlook/
// Apple Mail needs every rule inlined on the element itself.
function renderButton(url: string, label: string): string {
  return `<p style="margin:24px 0;"><a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;background-color:#436649;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-family:sans-serif;">${escapeHtml(label)}</a></p>`;
}

// `greeting` is plain text (it carries the user-chosen display name), so it is
// escaped here before entering HTML — callers must not pre-escape it.
// `bodyHtml` is trusted template markup and is inserted as-is.
function renderEmail(greeting: string, bodyHtml: string): string {
  const appName = escapeHtml(process.env.APP_NAME ?? 'KUKO WAY');
  return `<div style="font-family:sans-serif;color:#27362a;max-width:480px;margin:0 auto;">
    <p style="font-weight:700;font-size:16px;">${appName}</p>
    <p>${escapeHtml(greeting)}</p>
    ${bodyHtml}
  </div>`;
}

export async function sendVerificationEmail(to: string, name: string | null, rawToken: string): Promise<void> {
  const link = `${baseUrl()}/verify-email?token=${encodeURIComponent(rawToken)}`;
  const safeLink = escapeHtml(link);
  const greeting = name ? `Hi ${name},` : 'Hi,';

  await sendMail({
    to,
    subject: 'Verify your email address',
    text: `${greeting}\n\nPlease verify your email address by visiting:\n${link}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    html: renderEmail(
      greeting,
      `<p>Please verify your email address to activate your account.</p>
       ${renderButton(link, 'Verify email address')}
       <p style="font-size:13px;color:#57815c;">Or paste this link into your browser: <a href="${safeLink}">${safeLink}</a></p>
       <p style="font-size:13px;color:#57815c;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>`,
    ),
  });
}

export async function sendPasswordResetEmail(to: string, name: string | null, rawToken: string): Promise<void> {
  const link = `${baseUrl()}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const safeLink = escapeHtml(link);
  const greeting = name ? `Hi ${name},` : 'Hi,';

  await sendMail({
    to,
    subject: 'Reset your password',
    text: `${greeting}\n\nWe received a request to reset your password. Visit this link to choose a new one:\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email — your password will not change.`,
    html: renderEmail(
      greeting,
      `<p>We received a request to reset your password.</p>
       ${renderButton(link, 'Reset password')}
       <p style="font-size:13px;color:#57815c;">Or paste this link into your browser: <a href="${safeLink}">${safeLink}</a></p>
       <p style="font-size:13px;color:#57815c;">This link expires in 1 hour. If you didn't request this, you can ignore this email — your password will not change.</p>`,
    ),
  });
}
