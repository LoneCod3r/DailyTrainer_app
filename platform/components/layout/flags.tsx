import type { SVGProps } from 'react';

// Flat flag glyphs for the language switcher. Kept separate from icons.tsx:
// those are single-color stroke icons (currentColor), while flags are
// inherently multi-color fills — a different visual category, not a
// variant of the same pattern. Unicode flag emoji (🇧🇬/🇬🇧) render as plain
// two-letter codes on Windows (no color flag glyphs in Segoe UI Emoji), so
// these are drawn directly instead.
type FlagProps = SVGProps<SVGSVGElement>;

export function BulgariaFlag(props: FlagProps) {
  return (
    <svg width={16} height={12} viewBox="0 0 30 20" aria-hidden="true" {...props}>
      <rect width="30" height="20" fill="#fff" />
      <rect y="6.67" width="30" height="6.67" fill="#00966E" />
      <rect y="13.33" width="30" height="6.67" fill="#D62612" />
    </svg>
  );
}

export function UKFlag(props: FlagProps) {
  return (
    <svg width={16} height={12} viewBox="0 0 30 20" aria-hidden="true" {...props}>
      <defs>
        <clipPath id="uk-flag-bounds">
          <rect width="30" height="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#uk-flag-bounds)">
        <rect width="30" height="20" fill="#00247D" />
        <path d="M0,0 30,20M30,0 0,20" stroke="#fff" strokeWidth="4" />
        <path d="M0,0 30,20M30,0 0,20" stroke="#CF142B" strokeWidth="1.6" />
        <path d="M15,0V20M0,10H30" stroke="#fff" strokeWidth="6.6" />
        <path d="M15,0V20M0,10H30" stroke="#CF142B" strokeWidth="4" />
      </g>
    </svg>
  );
}
