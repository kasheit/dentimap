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
      boxShadow: {
        card: '0 1px 2px rgb(20 22 30 / 0.05)',
        pop: '0 8px 24px rgb(20 22 30 / 0.12), 0 2px 6px rgb(20 22 30 / 0.06)',
      },
      transitionTimingFunction: {
        luxury: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      animation: {
        rise: 'rise 0.26s cubic-bezier(0.16, 1, 0.3, 1) both',
        'view-in': 'viewIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 0.14s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.12s ease-out both',
        'sheet-in': 'sheetIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'view-out': 'viewOut 0.09s cubic-bezier(0.4, 0, 1, 1) both',
        'pulse-ring': 'pulseRing 2.4s ease-out infinite',
        'pulse-soft': 'pulseSoft 2.6s ease-in-out infinite',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
      },
      keyframes: {
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        viewIn: { '0%': { opacity: '0', transform: 'translateY(10px) scale(0.994)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        viewOut: { '0%': { opacity: '1', transform: 'translateY(0) scale(1)' }, '100%': { opacity: '0', transform: 'translateY(-6px) scale(0.996)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.97) translateY(-4px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        sheetIn: { '0%': { opacity: '0', transform: 'translateY(14px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--dm-green) / 0.55)' },
          '70%, 100%': { boxShadow: '0 0 0 6px rgb(var(--dm-green) / 0)' },
        },
        pulseSoft: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--dm-blue) / 0)' },
          '50%': { boxShadow: '0 0 0 5px rgb(var(--dm-blue) / 0.06)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.82)' },
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
