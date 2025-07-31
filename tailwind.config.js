/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'tahoma': ['Tahoma', 'sans-serif'],
      },
      colors: {
        'turquoise': '#1f8a8c',
        'soft-orange': '#ffeaa7',
        'soft-green': '#00b894',
        'soft-red': '#fd79a8',
      },
    },
  },
  plugins: [],
}