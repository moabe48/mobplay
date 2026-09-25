/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#e50914',
          600: '#dc2626',
          700: '#b91c1c',
          900: '#7f1d1d',
        },
        dark: {
          bg: '#0B0E14',
          card: '#151B26',
          cardHover: '#1E2638',
          border: '#2B354A',
          sidebar: '#0E131F',
          header: '#0E131F',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
