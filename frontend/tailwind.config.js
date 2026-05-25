/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1E3A5F',
          light: '#2A4F7A',
          dark: '#152B47',
        },
        accent: '#2563EB',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
