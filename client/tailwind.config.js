/** @type {import('tailwindcss').Config} */

/**
 * `ink` and `surface` resolve through CSS custom properties (defined in
 * src/styles/index.css for :root and .dark) so light/dark theming applies
 * app-wide via one class toggle on <html>, without every component needing
 * a `dark:` variant — see docs/ARCHITECTURE.md §12. The `<alpha-value>`
 * placeholder is Tailwind's documented pattern for keeping opacity
 * modifiers (e.g. `text-ink-600/50`) working with CSS-variable colors.
 */
const themedColor = (varName) => `rgb(var(${varName}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Ink & Signal" palette — deep ink sidebar, neutral slate surface,
        // a single teal "signal" accent reserved for primary actions and
        // active pipeline states. See docs/ARCHITECTURE.md / design notes.
        ink: {
          DEFAULT: themedColor('--color-ink'),
          800: themedColor('--color-ink-800'),
          700: themedColor('--color-ink-700'),
          600: themedColor('--color-ink-600'),
        },
        surface: {
          DEFAULT: themedColor('--color-surface'),
          100: themedColor('--color-surface-100'),
          200: themedColor('--color-surface-200'),
          300: themedColor('--color-surface-300'),
        },
        // Fixed — the sidebar is always dark regardless of the app theme
        // (a deliberate Phase 1 design signature), so it deliberately does
        // NOT use the themed `ink` tokens above, which flip in dark mode.
        sidebar: {
          DEFAULT: '#12141C',
          700: '#242838',
        },
        'sidebar-fg': '#E3E6EF',
        brand: {
          50: '#EEFCFB',
          100: '#D2F6F3',
          200: '#A6EDE6',
          400: '#2DD4C6',
          500: '#0EA5A0',
          600: '#0B8681',
          700: '#086B67',
        },
        amber: {
          50: '#FFFBEB',
          400: '#F5A524',
          500: '#F59E0B',
          600: '#D97706',
        },
        rose: {
          50: '#FFF1F2',
          400: '#FB7185',
          500: '#E11D48',
          600: '#BE123C',
        },
      },
      fontFamily: {
        display: ['"Sora"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(18, 20, 28, 0.04), 0 4px 12px rgba(18, 20, 28, 0.04)',
        popover: '0 8px 24px rgba(18, 20, 28, 0.12)',
      },
      borderRadius: {
        xl: '0.875rem',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};
