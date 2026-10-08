import { describe, it, expect, vi, afterEach } from 'vitest';
import { createLogger } from '@/lib/logger';

// The logger redacts known-sensitive context keys, so a password can't end up
// in application logs even if one is passed by mistake.
afterEach(() => {
  vi.restoreAllMocks();
});

describe('logger redaction', () => {
  it.each(['password', 'currentPassword', 'newPassword', 'confirmPassword', 'passwordHash', 'token', 'secret'])(
    'redacts %s',
    (key) => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
      createLogger('test').info('event', { [key]: 'sensitive-value-123', userId: 'u1' });

      const line = spy.mock.calls[0][0] as string;
      expect(line).not.toContain('sensitive-value-123');
      expect(JSON.parse(line)).toMatchObject({ [key]: '[redacted]', userId: 'u1' });
    },
  );
});
