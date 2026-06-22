/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rose: {
          50: 'var(--rose-50)',
          100: 'var(--rose-100)',
          200: 'var(--rose-200)',
          400: 'var(--rose-400)',
          600: 'var(--rose-600)',
          800: 'var(--rose-800)',
        },
        gold: {
          DEFAULT: 'var(--gold)',
          light: 'var(--gold-light)',
        },
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        borderColor: {
          DEFAULT: 'var(--border)',
        },
      },
      fontFamily: {
        title: ['"Crimson Pro"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      }
    },
  },
  plugins: [],
}
