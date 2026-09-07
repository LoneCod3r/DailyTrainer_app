import { readFile } from 'fs/promises';
import path from 'path';

// Reads the dev/test-only mail capture lib/mail.ts writes for every outgoing
// email (see OUTBOX_DIR there) — this suite has no real inbox to check, so
// this is how e2e specs get the actual verification/reset link a test run
// generated. Node fs access is fine here: Playwright test files run in Node,
// not the browser.
const OUTBOX_DIR = path.join(process.cwd(), 'tests', '.mail-outbox');

type CapturedMail = { to: string; subject: string; html: string; text: string; sentAt: string };

async function readCapturedMail(email: string): Promise<CapturedMail> {
  const fileName = `${email.replace(/[^a-z0-9@._-]/gi, '_')}.json`;
  const raw = await readFile(path.join(OUTBOX_DIR, fileName), 'utf-8');
  return JSON.parse(raw) as CapturedMail;
}

function extractToken(text: string): string {
  const match = text.match(/[?&]token=([^&\s]+)/);
  if (!match) throw new Error(`No token found in captured email text: ${text}`);
  return decodeURIComponent(match[1]);
}

// Polls briefly since sending happens asynchronously right after the
// register/resend/forgot-password API call resolves.
export async function waitForToken(email: string, timeoutMs = 10_000): Promise<string> {
  const start = Date.now();
  let lastErr: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      const mail = await readCapturedMail(email);
      return extractToken(mail.text);
    } catch (err) {
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`Timed out waiting for email to ${email}`);
}
