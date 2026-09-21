/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dm: {
          bg: 'rgb(var(--dm-bg) / <alpha-value>)',
          surface: 'rgb(var(--dm-surface) / <alpha-value>)',
          raised: 'rgb(var(--dm-raised) / <alpha-value>)',
          border: 'rgb(var(--dm-border) / <alpha-value>)',
          hover: 'rgb(var(--dm-hover) / <alpha-value>)',
          text: 'rgb(var(--dm-text) / <alpha-value>)',
          muted: 'rgb(var(--dm-muted) / <alpha-value>)',
          dim: 'rgb(var(--dm-dim) / <alpha-value>)',
          blue: 'rgb(var(--dm-blue) / <alpha-value>)',
          green: 'rgb(var(--dm-green) / <alpha-value>)',
          amber: 'rgb(var(--dm-amber) / <alpha-value>)',
          red: 'rgb(var(--dm-red) / <alpha-value>)',
        },
      },
      fontSize: {
        label: ['13px', '18px'],
        body: ['14px', '22px'],
        title: ['16px', '24px'],
        display: ['28px', '34px'],
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
