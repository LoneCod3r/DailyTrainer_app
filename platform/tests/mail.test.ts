import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// lib/mail.ts caches its nodemailer transporter at module scope (created
// once, from whatever SMTP_* env vars are set the first time it's needed) —
// production wants that caching, but it means tests that vary SMTP_HOST
// across cases must reset the module registry and re-import fresh each
// time, or they'd all share the first test's transporter.
const sendMailMock = vi.fn();
const createTransportMock = vi.fn(() => ({ sendMail: sendMailMock }));
const getTestMessageUrlMock = vi.fn(() => false as string | false);

vi.mock('nodemailer', () => ({
  default: {
    createTransport: createTransportMock,
    getTestMessageUrl: getTestMessageUrlMock,
  },
}));

async function loadMail() {
  return import('@/lib/mail');
}

const SAMPLE = { to: 'user@example.dev', subject: 'Hi', html: '<p>hi</p>', text: 'hi' };

beforeEach(() => {
  vi.resetModules();
  sendMailMock.mockReset();
  createTransportMock.mockClear();
  getTestMessageUrlMock.mockReset();
  getTestMessageUrlMock.mockReturnValue(false);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('sendMail', () => {
  it('sends through the configured SMTP transporter when SMTP_HOST is set', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.test');
    vi.stubEnv('SMTP_PORT', '2525');
    vi.stubEnv('SMTP_SECURE', 'false');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('EMAIL_FROM', 'KUKO WAY <no-reply@example.dev>');
    sendMailMock.mockResolvedValue({ messageId: 'abc123' });

    const { sendMail } = await loadMail();
    await sendMail(SAMPLE);

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.example.test', port: 2525, secure: false }),
    );
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'KUKO WAY <no-reply@example.dev>',
        to: SAMPLE.to,
        subject: SAMPLE.subject,
        html: SAMPLE.html,
        text: SAMPLE.text,
      }),
    );
  });

  it('throws EmailDeliveryError when a configured SMTP send genuinely fails', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.test');
    vi.stubEnv('NODE_ENV', 'test');
    sendMailMock.mockRejectedValue(new Error('connection refused'));

    const { sendMail, EmailDeliveryError } = await loadMail();
    await expect(sendMail(SAMPLE)).rejects.toBeInstanceOf(EmailDeliveryError);
  });

  it('falls back to logging (does not throw) when SMTP is unconfigured outside production', async () => {
    vi.stubEnv('SMTP_HOST', '');
    vi.stubEnv('NODE_ENV', 'development');

    const { sendMail } = await loadMail();
    await expect(sendMail(SAMPLE)).resolves.toBeUndefined();
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it('throws EmailDeliveryError when SMTP is unconfigured in production — never silently skips', async () => {
    vi.stubEnv('SMTP_HOST', '');
    vi.stubEnv('NODE_ENV', 'production');

    const { sendMail, EmailDeliveryError } = await loadMail();
    await expect(sendMail(SAMPLE)).rejects.toBeInstanceOf(EmailDeliveryError);
    expect(createTransportMock).not.toHaveBeenCalled();
  });

  it('logs an Ethereal preview URL when the transport provides one, without failing otherwise', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.ethereal.email');
    vi.stubEnv('NODE_ENV', 'test');
    sendMailMock.mockResolvedValue({ messageId: 'eth-1' });
    getTestMessageUrlMock.mockReturnValue('https://ethereal.email/message/eth-1');

    const { sendMail } = await loadMail();
    await expect(sendMail(SAMPLE)).resolves.toBeUndefined();
    expect(getTestMessageUrlMock).toHaveBeenCalled();
  });
});

describe('sendVerificationEmail', () => {
  it('builds a verification link at APP_URL/verify-email carrying the raw token, with a clickable button', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.test');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('APP_URL', 'https://kuko.example');
    sendMailMock.mockResolvedValue({ messageId: 'v1' });

    const { sendVerificationEmail } = await loadMail();
    await sendVerificationEmail('user@example.dev', 'Tedd', 'raw-token-abc123');

    const call = sendMailMock.mock.calls[0][0];
    const expectedLink = 'https://kuko.example/verify-email?token=raw-token-abc123';
    expect(call.to).toBe('user@example.dev');
    expect(call.subject).toMatch(/verify/i);
    expect(call.text).toContain(expectedLink);
    expect(call.html).toContain(expectedLink);
    // A real <a> element, not just a bare URL — the "clear verification button" requirement.
    expect(call.html).toMatch(/<a href="https:\/\/kuko\.example\/verify-email\?token=raw-token-abc123"[^>]*>/);
  });

  it('URL-encodes a token containing characters that need escaping', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.test');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('APP_URL', 'https://kuko.example');
    sendMailMock.mockResolvedValue({ messageId: 'v2' });

    const { sendVerificationEmail } = await loadMail();
    await sendVerificationEmail('user@example.dev', null, 'token/with+special=chars');

    const call = sendMailMock.mock.calls[0][0];
    expect(call.html).toContain(encodeURIComponent('token/with+special=chars'));
    expect(call.html).not.toContain('token/with+special=chars"'); // raw, unencoded form shouldn't appear in the href
  });
});

describe('sendPasswordResetEmail', () => {
  it('builds a reset link at APP_URL/reset-password carrying the raw token', async () => {
    vi.stubEnv('SMTP_HOST', 'smtp.example.test');
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('APP_URL', 'https://kuko.example');
    sendMailMock.mockResolvedValue({ messageId: 'r1' });

    const { sendPasswordResetEmail } = await loadMail();
    await sendPasswordResetEmail('user@example.dev', 'Tedd', 'reset-token-xyz');

    const call = sendMailMock.mock.calls[0][0];
    const expectedLink = 'https://kuko.example/reset-password?token=reset-token-xyz';
    expect(call.text).toContain(expectedLink);
    expect(call.html).toContain(expectedLink);
  });
});
