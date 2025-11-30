/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1DA1F2',
        'brand-dark': '#0f172a',
        'brand-light': '#1e293b',
        'brand-accent': '#38bdf8',
      },
      screens: {
        'xs': '475px',
      },
    },
  },
  plugins: [],
}

