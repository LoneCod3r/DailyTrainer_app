import type { Config } from 'tailwindcss';

// Design-system tokens for the "Foundation Phase". Kept intentionally small —
// modules added later (Courses, Events, Discussions, ...) should reuse these
// tokens rather than introducing their own one-off colors/spacing.
const config: Config = {
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
        sand: {
          50: '#fbf9f6',
          100: '#f4efe7',
          200: '#e7dccb',
          300: '#d6c3a5',
        },
        ink: {
          900: '#1c1f1d',
          700: '#3a3f3b',
          500: '#6b716c',
          300: '#a4aaa5',
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
