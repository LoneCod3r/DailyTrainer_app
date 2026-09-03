// Tiny className joiner so the design system doesn't need a extra dependency
// for something this small. Falsy values (false, undefined, '') are dropped.
export function clsx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
