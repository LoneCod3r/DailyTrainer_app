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
        brand: {
          50: '#f4f7f4',
          100: '#e6ede6',
          200: '#c9dbca',
          300: '#a3c1a5',
          400: '#79a17d',
          500: '#57815c',
          600: '#436649',
          700: '#37513c',
          800: '#2e4232',
          900: '#27362a',
        },
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
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 2px 20px rgba(28, 31, 29, 0.06)',
        card: '0 1px 3px rgba(28, 31, 29, 0.08), 0 1px 2px rgba(28,31,29,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
