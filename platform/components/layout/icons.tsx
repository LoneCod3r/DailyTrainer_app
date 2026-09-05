import type { SVGProps } from 'react';

// Small hand-rolled icon set (no icon library dependency) for the app shell
// navigation. Each icon is intentionally minimal — one weight, 20x20 — so the
// sidebar/bottom nav/topbar stay visually consistent.
type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    ...props,
  };
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 9.5 10 3l7 6.5" />
      <path d="M5 8.5V17h10V8.5" />
    </svg>
  );
}

export function PracticesIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 17.5c4-1 6.5-4.7 6.5-9.3 0-1.3-.15-2.4-.4-3.2-4.4.2-7.6 2-9.1 4.8-1.1 2-1.2 4.5-.3 6.6" />
      <path d="M10 17.5c-1.7-2.5-1.7-6 .6-9" />
    </svg>
  );
}

export function CommunityIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="7" cy="7.5" r="2.3" />
      <circle cx="14" cy="8.5" r="1.9" />
      <path d="M3 16c.5-2.6 2-4 4-4s3.5 1.4 4 4" />
      <path d="M12.3 12.3c1.7.2 2.9 1.6 3.3 3.7" />
    </svg>
  );
}

export function AccountIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="7" r="3.2" />
      <path d="M3.8 17c.7-3.2 3-5 6.2-5s5.5 1.8 6.2 5" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8.8" cy="8.8" r="5.3" />
      <path d="m16.5 16.5-3.4-3.4" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="3.2" />
      <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.6 4.6l1.4 1.4M14 14l1.4 1.4M15.4 4.6 14 6M6 14l-1.4 1.4" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M16.5 12.3A6.8 6.8 0 0 1 7.7 3.5a6.8 6.8 0 1 0 8.8 8.8Z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 5.5h14M3 10h14M3 14.5h14" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m4.5 4.5 11 11M15.5 4.5l-11 11" />
    </svg>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 8 4 4 4-4" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="10" cy="10" r="2.6" />
      <path d="M10 3.5v1.6M10 14.9v1.6M16.5 10h-1.6M5.1 10H3.5M14.6 5.4l-1.1 1.1M6.5 13.5l-1.1 1.1M14.6 14.6l-1.1-1.1M6.5 6.5 5.4 5.4" />
    </svg>
  );
}

export function MembershipIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 3 5 5.5v4c0 3.6 2.1 6.3 5 7.3 2.9-1 5-3.7 5-7.3v-4L10 3Z" />
    </svg>
  );
}

export function BillingIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5.5" width="14" height="9.5" rx="1.6" />
      <path d="M3 8.8h14" />
    </svg>
  );
}

export function DonationIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 16.5s-6-3.6-6-8.1C4 5.9 5.7 4.3 7.7 4.3c1 0 2 .5 2.3 1.3.3-.8 1.3-1.3 2.3-1.3 2 0 3.7 1.6 3.7 4.1 0 4.5-6 8.1-6 8.1Z" />
    </svg>
  );
}

export function LogOutIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 17H4.8A1.8 1.8 0 0 1 3 15.2V4.8A1.8 1.8 0 0 1 4.8 3H8" />
      <path d="M13 13.5 17 10l-4-3.5M17 10H7.5" />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 3 4 5v4.5c0 4 2.6 6.6 6 7.5 3.4-.9 6-3.5 6-7.5V5l-6-2Z" />
    </svg>
  );
}
