/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Ink & Signal" palette — deep ink sidebar, neutral slate surface,
        // a single teal "signal" accent reserved for primary actions and
        // active pipeline states. See docs/ARCHITECTURE.md / design notes.
        ink: {
          DEFAULT: '#12141C',
          800: '#1B1E2A',
          700: '#242838',
          600: '#2E3346',
        },
        surface: {
          DEFAULT: '#F5F6FA',
          100: '#FFFFFF',
          200: '#EEF0F6',
          300: '#E3E6EF',
        },
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
    },
  },
  plugins: [],
};
