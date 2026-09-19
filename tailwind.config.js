/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dm: {
          bg: '#0a0e16',
          surface: '#111317',
          raised: '#151922',
          border: '#232730',
          hover: '#181b22',
          text: '#f8fafc',
          muted: '#94a3b8',
          dim: '#64748b',
          blue: '#38bdf8',
          green: '#34d399',
          amber: '#fbbf24',
          red: '#f87171',
        },
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
