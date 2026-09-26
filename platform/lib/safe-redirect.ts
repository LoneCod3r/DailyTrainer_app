// Validates a user-supplied post-login destination (e.g. ?callbackUrl=...)
// before it is handed to window.location. Only same-origin, root-relative
// paths are allowed; anything else (absolute URLs, protocol-relative
// "//host", "javascript:" and other schemes, backslash tricks) returns null so
// the caller falls back to its own safe default.
const INTERNAL_BASE = 'http://internal.invalid';

export function safeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null;

  // Root-relative only — which also rules out every "scheme:" form — but not
  // protocol-relative ("//evil.example" is a different host).
  if (!value.startsWith('/') || value.startsWith('//')) return null;

  // Browsers treat "\" like "/" ("/\evil.example" becomes "//evil.example")
  // and silently drop tabs/newlines while parsing ("/\t/evil.example"), so
  // reject backslashes and control characters outright.
  for (const char of value) {
    const code = char.charCodeAt(0);
    if (char === '\\' || code < 0x20 || code === 0x7f) return null;
  }

  // Final check: resolving it must stay on the same origin.
  try {
    if (new URL(value, INTERNAL_BASE).origin !== INTERNAL_BASE) return null;
  } catch {
    return null;
  }

  return value;
}
