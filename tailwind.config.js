/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: {
          50: '#eef1f7',
          100: '#d4dae8',
          200: '#a9b4cf',
          300: '#7686ad',
          400: '#475a86',
          500: '#2c3d63',
          600: '#1c2a4a',
          700: '#152039',
          800: '#0f1729',
          900: '#0a0f1d',
          950: '#060a14',
        },
        teal: {
          50: '#effcf6',
          100: '#d8f7e9',
          200: '#b3edd2',
          300: '#7edcb4',
          400: '#3fc28f',
          500: '#1ba877',
          600: '#0f8760',
          700: '#0c6b4e',
          800: '#0c5540',
          900: '#0b4636',
          950: '#042821',
        },
        accent: {
          DEFAULT: '#1ba877',
          soft: '#3fc28f',
          deep: '#0c6b4e',
        },
      },
      boxShadow: {
        card: '0 1px 2px 0 rgba(15, 23, 41, 0.04), 0 1px 3px 0 rgba(15, 23, 41, 0.06)',
        'card-hover': '0 4px 12px -2px rgba(15, 23, 41, 0.08), 0 2px 6px -2px rgba(15, 23, 41, 0.06)',
        panel: '0 20px 50px -12px rgba(15, 23, 41, 0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
