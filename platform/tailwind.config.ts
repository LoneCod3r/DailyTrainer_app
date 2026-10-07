import type { Config } from 'tailwindcss';

// Design-system tokens for the "Foundation Phase". Kept intentionally small —
// modules added later (Courses, Events, Discussions, ...) should reuse these
// tokens rather than introducing their own one-off colors/spacing.
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './modules/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Natural Sage scale (KUKO WAY concept §17). 500 is the concept's
        // own #7D8B72 and 300 its Soft Moss #AAB39C — both decorative-only
        // (fills, dots, rings). 600+ are the derived text/button-safe
        // shades: white on brand-600 is 5.5:1, on brand-700 7.5:1.
        brand: {
          50: '#f3f4f0',
          100: '#e6e9e1',
          200: '#cdd3c4',
          300: '#aab39c',
          400: '#94a086',
          500: '#7d8b72',
          600: '#5f6d55',
          700: '#4c5844',
          800: '#3d4637',
          900: '#2f362b',
        },
        // Clay accent (#B77D61) — `clay` itself is the dark-mode-aware,
        // text-safe shade from globals.css; `clay-fill` is the concept hex
        // for decorative fills only.
        clay: 'rgb(var(--clay) / <alpha-value>)',
        'clay-fill': '#b77d61',
        // Near-black (concept §18) for practice mode / video areas — fixed,
        // not theme-dependent, since practice mode is dark in both themes.
        night: '#181917',
        // sand/ink/surface/page are CSS-variable-backed (see globals.css) so
        // every existing `text-ink-*` / `border-sand-*` / `bg-surface` usage
        // repaints for dark mode without touching each call site.
        sand: {
          50: 'rgb(var(--sand-50) / <alpha-value>)',
          100: 'rgb(var(--sand-100) / <alpha-value>)',
          200: 'rgb(var(--sand-200) / <alpha-value>)',
          300: 'rgb(var(--sand-300) / <alpha-value>)',
        },
        ink: {
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        page: 'rgb(var(--page) / <alpha-value>)',
        // Dark-mode-aware brand accents — see globals.css. Use these
        // instead of the static brand-50/100/700 shades for active states,
        // soft badges and links so they stay legible in dark mode.
        'brand-tint': 'rgb(var(--brand-tint) / <alpha-value>)',
        link: 'rgb(var(--link) / <alpha-value>)',
        // Payment-method card face gradient — see globals.css.
        'card-face': {
          from: 'rgb(var(--card-face-from) / <alpha-value>)',
          to: 'rgb(var(--card-face-to) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        // Large philosophical headings only (concept §19) — see globals.css.
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 20px rgba(37, 38, 34, 0.06)',
        card: '0 1px 3px rgba(37, 38, 34, 0.06), 0 1px 2px rgba(37, 38, 34, 0.03)',
      },
    },
  },
  plugins: [],
};

export default config;
