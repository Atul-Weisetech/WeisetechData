/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f4',
          100: '#fce5ea',
          200: '#f7cdd6',
          300: '#f1a9b8',
          400: '#ea7d96',
          500: '#e25273',
          600: '#cc0d49',  // This is our main color
          700: '#af093d',
          800: '#8f0c37',
          900: '#770f32',
          950: '#440318',
        }
      }
    },
  },
  plugins: [],
}