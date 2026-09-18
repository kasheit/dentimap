/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        page: '#1B1E23',
        card: '#22262C',
        nested: '#272B32',
        border: '#333A42',
        text: {
          primary: '#ECEFF2',
          secondary: '#9BA5B0',
          muted: '#6B7480',
        },
        legal: {
          base: '#2F7A6B',
          bg: '#17251F',
          text: '#6FCBB0',
        },
        reported: {
          base: '#C98A2E',
          bg: '#2A2013',
          text: '#E3AE5E',
        },
        unverified: {
          base: '#8A3A3A',
          bg: '#241717',
          text: '#D08080',
        },
      },
    },
  },
  plugins: [],
};
