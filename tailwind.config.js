/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dm: {
          bg: '#0f1114',
          surface: '#15181c',
          raised: '#1a1e23',
          border: '#242930',
          hover: '#1b1f25',
          text: '#e7e9ec',
          muted: '#9ba3ad',
          dim: '#6c7580',
          blue: '#7eb0ff',
          green: '#63c99b',
          amber: '#dcae56',
          red: '#e58080',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
