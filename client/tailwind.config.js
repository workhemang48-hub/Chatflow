/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#08150F',
        flow: {
          DEFAULT: '#0F6E56',
          light: '#5DCAA5', // "signal" — accent / presence dots
        },
        signal: '#5DCAA5',
        mist: '#E1F5EE', // light text on dark
      },
      fontFamily: {
        // Calm rounded direction: soft sans for the wordmark + headings,
        // a neutral grotesk for body/UI, monospace used sparingly for
        // timestamps, status labels, and room ids.
        display: ['"Quicksand"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
      },
    },
  },
  plugins: [],
};
