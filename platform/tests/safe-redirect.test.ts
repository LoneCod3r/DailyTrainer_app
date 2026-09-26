import { describe, it, expect } from 'vitest';
import { safeInternalPath } from '@/lib/safe-redirect';

describe('safeInternalPath (login callbackUrl validation)', () => {
  it.each([
    '/',
    '/account',
    '/admin',
    '/moderation',
    '/account/membership',
    '/community/courses/foundations-of-practice/getting-grounded/why-consistency-matters',
    '/blog?category=community',
    '/practices#section',
    '/javascript:alert(1)', // a path segment on this origin, not a scheme
  ])('accepts the internal path %s unchanged', (value) => {
    expect(safeInternalPath(value)).toBe(value);
  });

  it.each([
    ['external https URL', 'https://evil.example'],
    ['external http URL', 'http://evil.example/account'],
    ['protocol-relative URL', '//evil.example'],
    ['protocol-relative URL with path', '//evil.example/account'],
    ['javascript: scheme', 'javascript:alert(document.cookie)'],
    ['mixed-case javascript: scheme', 'JavaScript:alert(1)'],
    ['data: scheme', 'data:text/html,<script>alert(1)</script>'],
    ['backslash bypass', '/\\evil.example'],
    ['double backslash bypass', '\\\\evil.example'],
    ['slash + backslash bypass', '/\\/evil.example'],
    ['tab-smuggled protocol-relative URL', '/\t/evil.example'],
    ['newline-smuggled protocol-relative URL', '/\n/evil.example'],
    ['relative path without leading slash', 'account'],
    ['whitespace-prefixed URL', ' https://evil.example'],
  ])('rejects %s', (_label, value) => {
    expect(safeInternalPath(value)).toBeNull();
  });

  it('rejects empty and missing values', () => {
    expect(safeInternalPath('')).toBeNull();
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath(undefined)).toBeNull();
  });
});
